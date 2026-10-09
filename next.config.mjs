/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Old URLs from the first version of the site.
    return [
      { source: "/dianacdev", destination: "/apublicmenace", permanent: true },
      { source: "/diana_cervantes.vcf", destination: "/apublicmenace/vcard.vcf", permanent: true },
    ];
  },
};

export default nextConfig;
