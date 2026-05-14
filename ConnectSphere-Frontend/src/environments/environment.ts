type RuntimeEnvironment = {
  apiUrl?: string;
  googleClientId?: string;
  razorpayKeyId?: string;
};

const runtimeEnvironment = (
  globalThis as typeof globalThis & { __connectSphereEnv?: RuntimeEnvironment }
).__connectSphereEnv ?? {};

export const environment = {
  production: false,
  apiUrl: runtimeEnvironment.apiUrl ?? 'http://localhost:8080',
  googleClientId: runtimeEnvironment.googleClientId ?? '',
  razorpayKeyId: runtimeEnvironment.razorpayKeyId ?? ''
};
