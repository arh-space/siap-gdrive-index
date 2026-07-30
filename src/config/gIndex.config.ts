import { type z } from "zod";
import { BASE_URL, IS_DEV } from "~/constant";
import { type Schema_Config } from "~/types/schema";

const config: z.input<typeof Schema_Config> = {
  version: "2.4.2",
  basePath: IS_DEV ? "http://localhost:3000" : `https://${BASE_URL}`,
  showGuideButton: false,
  cacheControl: "public, max-age=60, s-maxage=60, stale-while-revalidate",

  apiConfig: {
    rootFolder: "555526cec9a8378f3bbbcc9f5f28a6529a97d386eb04f7cb0f2a5d2e9e711c332080b5faa62452043c367fc8eb8c59b14c;fab3663acdfb29c3dc5ae6c3",
    isTeamDrive: true,
    sharedDrive: "31b150de7226668a1b55ca4949aff999fb757e760e2b8957cc729c347e6bf7e9b5dcf5;2def54411e8e941840e1a4b3",

    defaultQuery: ["trashed = false", "(not mimeType contains 'google-apps' or mimeType contains 'folder')"],
    defaultField:
      "id, name, mimeType, thumbnailLink, fileExtension, modifiedTime, size, imageMediaMetadata, videoMediaMetadata, webContentLink, trashed",
    defaultOrder: "folder, name asc, modifiedTime desc",
    itemsPerPage: 50,
    searchResult: 5,

    specialFile: {
      password: ".password",
      readme: ".readme.md",
      banner: ".banner.jpg",
    },
    hiddenFiles: [".password", ".readme.md", ".banner", ".banner.jpg", ".banner.png", ".banner.webp"],
    proxyThumbnail: true,
    streamMaxSize: 15728640,
    maxFileSize: 1,
    allowDownloadProtectedFile: true,
    temporaryTokenDuration: 6,
  },

  siteConfig: {
    siteName: "SIAP",
    siteNameTemplate: "%s - %t",
    siteDescription: "Platform penyimpanan dan pengelolaan arsip pembelajaran yang memudahkan akses dan pencarian ke berbagai arsip pembelajaran, materi pendidikan, dokumen akademik, dan berbagai sumber belajar, dalam satu tempat.",
    siteIcon: "/logo.svg",
    siteAuthor: "SDN 118 PEKANBARU MEDIA",
    favIcon: "/favicon.png",
    robots: "index, follow",
    twitterHandle: "",
    showFileExtension: true,
    privateIndex: false,
    breadcrumbMax: 3,

    toaster: {
      position: "bottom-left",
      duration: 3000,
    },

    previewSettings: {
      manga: {
        maxSize: 15 * 1024 * 1024,
        maxItem: 10,
      },
    },

    navbarItems: [
      {
        "icon": "Instagram",
        "name": "Our Instagram",
        "href": "https://instagram.com/sdn.118pku",
        "external": true
      },
      {
        "icon": "GraduationCap",
        "name": "Main Site",
        "href": "https://sdn118pekanbaru.sch.id",
        "external": true
      }
    ],

    supports: [
      {
        "name": "Support Us",
        "currency": "IDR",
        "href": "https://traktir.in/sdn118pku"
      }
    ],

    footer: [
      {
        "value": "Copyright © {{ year }}  {{ siteName }} - Sistem Informasi Arsip Pembelajaran Ver.{{ version }}. All Rights Reserved."
      },
      {
        "value": "Developed & Maintened by {{ author }}"
      }
    ],
    experimental_pageLoadTime: false,
  },
};

export default config;
