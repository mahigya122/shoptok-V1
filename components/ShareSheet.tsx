import React from "react";
import { Share as RNShare, Platform } from "react-native";
import { Button } from "./UI";

type Props = { url?: string; title?: string };

export default function ShareSheet({ url, title }: Props) {
  const share = async (platform?: "whatsapp" | "facebook" | "twitter" | "email") => {
    if (!url && !title) {
      console.warn("ShareSheet: nothing to share");
      return;
    }
    const options: any = { message: title ?? "", url };
    // Prefer `react-native-share` on native if available (more features),
    // otherwise fall back to the built-in `Share` API which works in Expo Go.
    try {
      let ShareModule: any = null;
      if (Platform.OS !== "web") {
        try {
          // dynamic require so bundlers won't try to include native-only module for web
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          ShareModule = require("react-native-share");
        } catch (e) {
          ShareModule = null;
        }
      }

      if (ShareModule && ShareModule.open) {
        if (platform && (ShareModule as any).Social) {
          switch (platform) {
            case "whatsapp": options.social = (ShareModule as any).Social.WHATSAPP; break;
            case "facebook": options.social = (ShareModule as any).Social.FACEBOOK; break;
            case "twitter": options.social = (ShareModule as any).Social.TWITTER; break;
            case "email": options.social = (ShareModule as any).Social.EMAIL; break;
          }
        }
        await ShareModule.open(options);
      } else {
        // Fallback to React Native Share (works in Expo Go / without native module)
        const sharePayload: any = {};
        if (options.message) sharePayload.message = options.message;
        if (options.url) sharePayload.url = options.url;
        await RNShare.share(sharePayload);
      }
    } catch (err: any) {
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
