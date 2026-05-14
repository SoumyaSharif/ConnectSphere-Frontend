type RuntimeEnvironment = {
  apiUrl?: string;
  googleClientId?: string;
  razorpayKeyId?: string;
};

const runtimeEnvironment = (
  globalThis as typeof globalThis & { __connectSphereEnv?: RuntimeEnvironment }
).__connectSphereEnv ?? {};

export const environment = {
  production: true,
  apiUrl: runtimeEnvironment.apiUrl ?? 'https://api.connectsphere.com',
  googleClientId: runtimeEnvironment.googleClientId ?? '',
  razorpayKeyId: runtimeEnvironment.razorpayKeyId ?? ''
};
