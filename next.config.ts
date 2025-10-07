import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Removed output: 'export' to enable server-side functionality for NextAuth
  // Azure Static Web Apps can still be used with server-side rendering
}

export default nextConfig
