import { NextConfig } from 'next';
import withRspack from 'next-rspack';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  output: 'standalone',
};

export default withRspack(nextConfig);
