import CommonFormats from "../CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

/**
 * Rename-based handler for game/app formats that are just ZIP archives.
 * MCWorld, MCPack, MCAddon, MCTemplate, PK3, PK4, GMA, UnityPackage, etc.
 */
class renameGameZipHandler implements FormatHandler {
  public name = "renameGameZip";
  public contributor = "leothefleo49";
  public ready = true;

  public supportedFormats: FileFormat[] = [
    // Output
    CommonFormats.ZIP.builder("zip").allowTo(),

    // Minecraft Bedrock
    {
      name: "Minecraft Bedrock World",
      format: "mcworld",
      extension: "mcworld",
      mime: "application/x-mcworld",
      from: true,
      to: false,
      internal: "mcworld",
      category: "archive"
    },
    {
      name: "Minecraft Bedrock Resource/Behavior Pack",
      format: "mcpack",
      extension: "mcpack",
      mime: "application/x-mcpack",
      from: true,
      to: false,
      internal: "mcpack",
      category: "archive"
    },
    {
      name: "Minecraft Bedrock Addon",
      format: "mcaddon",
      extension: "mcaddon",
      mime: "application/x-mcaddon",
      from: true,
      to: false,
      internal: "mcaddon",
      category: "archive"
    },
    {
      name: "Minecraft Bedrock World Template",
      format: "mctemplate",
      extension: "mctemplate",
      mime: "application/x-mctemplate",
      from: true,
      to: false,
      internal: "mctemplate",
      category: "archive"
    },

    // id Tech / Quake
    {
      name: "Quake 3 Pack File",
      format: "pk3",
      extension: "pk3",
      mime: "application/x-pk3",
      from: true,
      to: false,
      internal: "pk3",
      category: "archive"
    },
    {
      name: "Doom 3 Pack File",
      format: "pk4",
      extension: "pk4",
      mime: "application/x-pk4",
      from: true,
      to: false,
      internal: "pk4",
      category: "archive"
    },

    // Garry's Mod (GMA is not quite ZIP but we'll handle the simple rename ones)
    // Unity
    {
      name: "Unity Package",
      format: "unitypackage",
      extension: "unitypackage",
      mime: "application/x-unitypackage",
      from: true,
      to: false,
      internal: "unitypackage",
      category: "archive"
    },

    // MSIX / APPX (Windows modern apps)
    {
      name: "Windows App Package (MSIX)",
      format: "msix",
      extension: "msix",
      mime: "application/msix",
      from: true,
      to: false,
      internal: "msix",
      category: "archive"
    },
    {
      name: "Windows App Package (APPX)",
      format: "appx",
      extension: "appx",
      mime: "application/appx",
      from: true,
      to: false,
      internal: "appx",
      category: "archive"
    },

    // Krita / OpenRaster (ZIP-based image editors)
    {
      name: "Krita Image",
      format: "kra",
      extension: "kra",
      mime: "application/x-krita",
      from: true,
      to: false,
      internal: "kra",
      category: ["image", "archive"]
    },
    {
      name: "OpenRaster Image",
      format: "ora",
      extension: "ora",
      mime: "image/openraster",
      from: true,
      to: false,
      internal: "ora",
      category: ["image", "archive"]
    },

    // EPUB (already handled by pandoc for doc conversion, but this extracts raw ZIP)
    {
      name: "EPUB Ebook",
      format: "epub",
      extension: "epub",
      mime: "application/epub+zip",
      from: true,
      to: false,
      internal: "epub",
      category: ["document", "archive"]
    },

    // XPI (Firefox addon) - already in renameZip but for completeness
    // CBZ (Comic Book ZIP)
    {
      name: "Comic Book Archive (ZIP)",
      format: "cbz",
      extension: "cbz",
      mime: "application/x-cbz",
      from: true,
      to: false,
      internal: "cbz",
      category: ["document", "archive"]
    },

    // Terraria mod
    {
      name: "Terraria Mod",
      format: "tmod",
      extension: "tmod",
      mime: "application/x-tmod",
      from: true,
      to: false,
      internal: "tmod",
      category: "archive"
    },

    // IPA (iOS app)
    {
      name: "iOS App Package",
      format: "ipa",
      extension: "ipa",
      mime: "application/x-ios-app",
      from: true,
      to: false,
      internal: "ipa",
      category: "archive"
    },
  ];

  async init() {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    _inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    return inputFiles.map(file => ({
      name: file.name.split(".")[0] + "." + outputFormat.extension,
      bytes: file.bytes
    }));
  }
}

export default renameGameZipHandler;
