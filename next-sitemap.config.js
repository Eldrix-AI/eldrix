/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://www.eldrix.app",
  generateRobotsTxt: true,
  exclude: ["/app/*", "/api/*", "/admin/*"],
  // You can also add additional configuration options here
};
