import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://blog.stowy.ch",
  author: "Stowy",
  desc: "The games programming blog of Stowy.",
  title: "Stowy",
  ogImage: "",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/St0wy",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "GitLab",
    href: "https://gitlab.com/Stowy",
    linkTitle: `${SITE.title} on GitLab`,
    active: true,
  },
  {
    name: "Mastodon",
    href: "https://mastodon.gamedev.place/@stowy",
    linkTitle: `${SITE.title} on Mastodon`,
    active: true,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/St0wy",
    linkTitle: `${SITE.title} on Twitter`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/fabian-huber-530b24207/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:stowy@protonmail.ch",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  }
];
