import React from "react";
import Share from "react-native-share";
import { Button } from "./UI";

type Props = { url?: string; title?: string };

export default function ShareSheet({ url, title }: Props) {
  const share = async (platform?: "whatsapp" | "facebook" | "twitter" | "email") => {
    if (!url && !title) {
      console.warn("ShareSheet: nothing to share");
      return;
    }

    const options: any = { message: title ?? "", url };
    try {
      if (platform && (Share as any).Social) {
        switch (platform) {
          case "whatsapp": options.social = (Share as any).Social.WHATSAPP; break;
          case "facebook": options.social = (Share as any).Social.FACEBOOK; break;
          case "twitter": options.social = (Share as any).Social.TWITTER; break;
          case "email": options.social = (Share as any).Social.EMAIL; break;
        }
      }
      await Share.open(options);
    } catch (err: any) {
      // User cancel will throw; ignore silently in that case
      const message = err?.message || err;
      if (message && !/cancel/i.test(String(message))) {
        console.warn("Share failed", err);
      }
    }
  };

  return (
    <>
      <Button label="Share" onPress={() => share()} />
    </>
  );
}
