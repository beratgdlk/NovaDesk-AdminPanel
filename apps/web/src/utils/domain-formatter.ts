export const cleanDomain = (domain: string): string => {
  let cleaned = domain.trim().toLowerCase();

  if (cleaned === "localhost") {
    return "localhost";
  }

  cleaned = cleaned.replace(/^https?:\/*/g, "");

  cleaned = cleaned.replace(/^https?:/g, "");

  cleaned = cleaned.replace(/^www\./, "");

  cleaned = cleaned.replace(/^\/+|\/+$/g, "");

  cleaned = cleaned.split(/[/@?#]/)[0];

  cleaned = cleaned.replace(/\s+/g, "");

  const commonTLDs = [
    "com",
    "net",
    "org",
    "edu",
    "gov",
    "co",
    "io",
    "me",
    "tr",
    "info",
    "biz",
  ];

  if (cleaned && !cleaned.includes(".")) {
    let foundTLD = null;

    for (const tld of commonTLDs) {
      if (cleaned.endsWith(tld) && cleaned.length > tld.length) {
        foundTLD = tld;
        break;
      }
    }

    if (foundTLD) {
      const domainPart = cleaned.substring(0, cleaned.length - foundTLD.length);
      cleaned = domainPart + "." + foundTLD;
    } else {
      cleaned = cleaned + ".com";
    }
  }

  return cleaned;
};
