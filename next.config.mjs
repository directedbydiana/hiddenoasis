/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Old URLs from the first version of the site.
      { source: "/dianacdev", destination: "/apublicmenace", permanent: true },
      { source: "/diana_cervantes.vcf", destination: "/apublicmenace/vcard.vcf", permanent: true },
      // The editor used to live under /admin; it is public now.
      { source: "/admin/new", destination: "/new", permanent: true },
      { source: "/admin/edit/:slug", destination: "/edit/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
