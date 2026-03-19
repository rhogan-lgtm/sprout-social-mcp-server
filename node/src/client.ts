/**
 * Sprout Social API client.
 *
 * Async HTTP client with Bearer token auth, exponential backoff on 429/5xx,
 * and proactive rate limiting (60 req/min).
 */

const MAX_RETRIES = 3;
const RATE_LIMIT_PER_MINUTE = 60;

interface RequestOptions {
  method: string;
  path: string;
  json?: any;
  params?: Record<string, string>;
}

interface ApiResponse {
  [key: string]: any;
}

export class SproutClient {
  private token: string;
  private customerId: string;
  private baseUrl: string;
  private requestTimestamps: number[] = [];

  constructor(
    token: string,
    customerId: string,
    baseUrl = "https://api.sproutsocial.com"
  ) {
    this.token = token;
    this.customerId = customerId;
    this.baseUrl = baseUrl;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than 60 seconds
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > now - 60000
    );

    if (this.requestTimestamps.length >= RATE_LIMIT_PER_MINUTE - 1) {
      const oldest = this.requestTimestamps[0];
      const wait = 60000 - (now - oldest) + 100;
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }

    this.requestTimestamps.push(Date.now());
  }

  private async request(options: RequestOptions): Promise<ApiResponse> {
    const { method, path, json, params } = options;
    const url = new URL(path, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    let lastStatus = 0;
    let lastBody = "";

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.throttle();

      const response = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: json ? JSON.stringify(json) : undefined,
      });

      if (response.status === 200 || response.status === 201) {
        return await response.json();
      }

      if (response.status === 204) {
        return { success: true };
      }

      lastStatus = response.status;
      lastBody = await response.text();

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const wait = Math.max(
          2 ** attempt * 1000,
          retryAfter ? parseInt(retryAfter) * 1000 : 0
        );
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      if (response.status >= 500) {
        const wait = 2 ** attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }

      // 4xx (not 429) — don't retry
      return {
        error: lastBody,
        status_code: response.status,
      };
    }

    return {
      error: `Sprout API returned ${lastStatus} after ${MAX_RETRIES} retries`,
      status_code: lastStatus,
      sprout_error: lastBody,
      attempts: MAX_RETRIES,
    };
  }

  // --- Tier 1: Core Workflow ---

  async getCustomerId(): Promise<ApiResponse> {
    return await this.request({
      method: "GET",
      path: "/v1/metadata/client",
    });
  }

  async listProfiles(): Promise<ApiResponse> {
    return await this.request({
      method: "GET",
      path: `/v1/${this.customerId}/metadata/customer`,
    });
  }

  async createPost(
    profileIds: string[],
    text: string,
    groupId?: string,
    scheduledAt?: string,
    mediaIds?: string[],
    tagIds?: number[]
  ): Promise<ApiResponse> {
    const body: any = {
      is_draft: true,
      customer_profile_ids: profileIds,
      text: text,
    };

    if (groupId) {
      body.group_id = groupId;
    }
    if (scheduledAt) {
      body.delivery = {
        scheduled_times: [scheduledAt],
        type: "SCHEDULED",
      };
    }
    if (mediaIds) {
      body.media = mediaIds.map((mid) => ({
        media_id: mid,
        media_type: "PHOTO",
      }));
    }
    if (tagIds) {
      body.tag_ids = tagIds;
    }

    return await this.request({
      method: "POST",
      path: `/v1/${this.customerId}/publishing/posts`,
      json: body,
    });
  }

  async getPost(postId: string): Promise<ApiResponse> {
    return await this.request({
      method: "GET",
      path: `/v1/${this.customerId}/publishing/posts/${postId}`,
    });
  }

  // --- Tier 2: Media, Metadata & Post Management ---

  async uploadMedia(url: string): Promise<ApiResponse> {
    return await this.request({
      method: "POST",
      path: `/v1/${this.customerId}/media/`,
      json: { url },
    });
  }

  async listTags(): Promise<ApiResponse> {
    return await this.request({
      method: "GET",
      path: `/v1/${this.customerId}/metadata/customer/tags`,
    });
  }

  async listUsers(): Promise<ApiResponse> {
    return await this.request({
      method: "GET",
      path: `/v1/${this.customerId}/metadata/customer/users`,
    });
  }

  // --- Tier 3: Analytics ---

  async getProfileAnalytics(
    profileIds: string[],
    startDate: string,
    endDate: string,
    metrics: string[]
  ): Promise<ApiResponse> {
    const body = {
      filters: [
        `customer_profile_id.eq(${profileIds.join(",")})`,
        `reporting_period.in(${startDate}...${endDate})`,
      ],
      metrics,
    };

    return await this.request({
      method: "POST",
      path: `/v1/${this.customerId}/analytics/profiles`,
      json: body,
    });
  }

  async getPostAnalytics(
    profileIds: string[],
    startDate: string,
    endDate: string,
    metrics?: string[]
  ): Promise<ApiResponse> {
    const defaultMetrics = [
      "lifetime.impressions",
      "lifetime.engagements",
      "lifetime.post_link_clicks",
      "lifetime.post_shares_count",
      "lifetime.likes",
      "lifetime.comments_count",
    ];

    const body = {
      filters: [
        `customer_profile_id.eq(${profileIds.join(",")})`,
        `created_time.in(${startDate}T00:00:00..${endDate}T23:59:59)`,
      ],
      fields: [
        "created_time",
        "perma_link",
        "text",
        "internal.sent_by.email",
      ],
      metrics: metrics || defaultMetrics,
      page: 1,
    };

    // Auto-paginate: the posts endpoint returns max 50 results per page.
    const allData: any[] = [];
    let page = 1;

    while (true) {
      body.page = page;
      const result = await this.request({
        method: "POST",
        path: `/v1/${this.customerId}/analytics/posts`,
        json: body,
      });

      if ("error" in result) {
        return result;
      }

      allData.push(...(result.data || []));

      const paging = result.paging || {};
      if (page >= (paging.total_pages || 1)) {
        break;
      }
      page++;
    }

    return {
      data: allData,
      paging: { total_pages: page, total_results: allData.length },
    };
  }
}
