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

    const options: { message?: string; url?: string; social?: any } = { message: title ?? "", url };

    try {
      let ShareModule: any = null;
      if (Platform.OS !== "web") {
        try {
          ShareModule = require("react-native-share");
        } catch (e) {
          ShareModule = null;
        }
      }

      if (ShareModule && ShareModule.open) {
        if (platform && ShareModule.Social) {
          switch (platform) {
            case "whatsapp": options.social = ShareModule.Social.WHATSAPP; break;
            case "facebook": options.social = ShareModule.Social.FACEBOOK; break;
            case "twitter": options.social = ShareModule.Social.TWITTER; break;
            case "email": options.social = ShareModule.Social.EMAIL; break;
          }
        }
        await ShareModule.open(options);
      } else {
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

  return <Button label="Share" onPress={() => share()} />;
}
