import functions from '@react-native-firebase/functions';

/** Calls a Cloud Function and surfaces a friendly error message. */
export async function call<T>(name: string, data?: Record<string, unknown>): Promise<T> {
  try {
    const res = await functions().httpsCallable(name)(data ?? {});
    return res.data as T;
  } catch (e: any) {
    const msg: string = e?.message || 'Something went wrong. Check your connection and try again.';
    throw new Error(msg.replace(/^\[.*?\]\s*/, ''));
  }
}
