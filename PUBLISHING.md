# Publishing Guide

This document contains step-by-step instructions for publishing the Sprout Social MCP server to PyPI and npm.

## Package Status

Both packages are built and ready to publish:

### Python Package (PyPI/uvx)
- **Location**: `dist/sprout_social_mcp-0.1.0-py3-none-any.whl` and `dist/sprout_social_mcp-0.1.0.tar.gz`
- **Size**: ~8.7KB (wheel), ~6.9KB (tarball)
- **Entry point**: `sprout-social-mcp` command
- **Package name**: `sprout-social-mcp`

### Node Package (npm/npx)
- **Location**: `node/dist/`
- **Entry point**: `node/dist/index.js` (executable)
- **Package name**: `sprout-social-mcp`
- **Shebang**: ✅ Present

---

## Publishing to PyPI

### Prerequisites
1. PyPI account: https://pypi.org/account/register/
2. API token: https://pypi.org/manage/account/token/

### Steps

1. **Install Twine** (if not already installed):
   ```bash
   pip3 install twine
   ```

2. **Verify the package** (already done):
   ```bash
   ls -lh dist/
   # Should show:
   # sprout_social_mcp-0.1.0-py3-none-any.whl (~8.7KB)
   # sprout_social_mcp-0.1.0.tar.gz (~6.9KB)
   ```

3. **Check package contents**:
   ```bash
   twine check dist/*
   ```

4. **Upload to Test PyPI** (recommended first):
   ```bash
   twine upload --repository testpypi dist/*
   ```

   You'll be prompted for:
   - Username: `__token__`
   - Password: Your PyPI API token (starts with `pypi-`)

5. **Test installation from Test PyPI**:
   ```bash
   uvx --index-url https://test.pypi.org/simple/ sprout-social-mcp
   ```

6. **Upload to Production PyPI**:
   ```bash
   twine upload dist/*
   ```

### Verification

After publishing, test with:
```bash
# Using uvx (recommended)
uvx sprout-social-mcp

# Or install globally
pip install sprout-social-mcp
sprout-social-mcp
```

Both should show an error about missing `SPROUT_API_TOKEN` and `SPROUT_CUSTOMER_ID` environment variables (this is expected).

---

## Publishing to npm

### Prerequisites
1. npm account: https://www.npmjs.com/signup
2. Authenticated npm CLI: Run `npm login`

### Steps

1. **Navigate to the Node package**:
   ```bash
   cd node
   ```

2. **Verify the build** (already done):
   ```bash
   ls -lh dist/
   # Should show:
   # index.js (with shebang)
   # index.d.ts
   # client.js
   # client.d.ts
   ```

3. **Test the package locally**:
   ```bash
   npm pack
   # Creates sprout-social-mcp-0.1.0.tgz

   # Inspect contents:
   tar -tzf sprout-social-mcp-0.1.0.tgz
   ```

4. **Check package for issues**:
   ```bash
   npm publish --dry-run
   ```

5. **Publish to npm**:
   ```bash
   npm publish --access public
   ```

   Note: The `--access public` flag is required for scoped packages or first-time publishes.

### Verification

After publishing, test with:
```bash
# Using npx (recommended)
npx -y sprout-social-mcp

# Or install globally
npm install -g sprout-social-mcp
sprout-social-mcp
```

Both should show an error about missing environment variables (this is expected).

---

## Post-Publishing Checklist

After both packages are published:

- [ ] Update README badges (if any) with package versions
- [ ] Test installation on a clean machine:
  - [ ] `uvx sprout-social-mcp` works
  - [ ] `npx -y sprout-social-mcp` works
- [ ] Create a GitHub release (v0.1.0)
- [ ] Tag the commit: `git tag v0.1.0 && git push origin v0.1.0`
- [ ] Update documentation with actual package names
- [ ] Announce on relevant channels (if applicable)

---

## Updating Versions

When releasing updates:

1. **Update version numbers**:
   - `pyproject.toml`: Update `version = "0.1.1"`
   - `node/package.json`: Update `"version": "0.1.1"`

2. **Rebuild both packages**:
   ```bash
   # Python
   rm -rf dist/
   python3 -m build

   # Node
   cd node
   npm run build
   ```

3. **Publish using same steps as above**

---

## Troubleshooting

### PyPI Upload Fails
- **Error: "File already exists"**
  - Solution: You cannot replace a version once published. Increment the version number.

- **Error: "Invalid credentials"**
  - Solution: Use `__token__` as username and your API token (including the `pypi-` prefix) as password.

### npm Publish Fails
- **Error: "You do not have permission to publish"**
  - Solution: Run `npm login` first, or check if the package name is already taken.

- **Error: "Cannot publish over existing version"**
  - Solution: Increment the version number in `package.json`.

### Package Not Found After Publishing
- Wait 5-10 minutes for package registries to sync
- Clear npm/pip cache: `npm cache clean --force` or `pip cache purge`

---

## Contact

For issues or questions:
- GitHub Issues: https://github.com/kodowjam/sprout-social-mcp-server/issues
- Package Maintainer: [Your contact info]
