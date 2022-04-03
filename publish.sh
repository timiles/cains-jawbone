# Exit if any command returns non-zero error code
set -e

# Bump version
version=`npm version minor`

# Build
npm run build
cp ./build/200.html ./build/404.html
git add .
git commit -m "Publish build $version"

# Commit and push
git push --follow-tags
git subtree push --prefix build origin gh-pages
