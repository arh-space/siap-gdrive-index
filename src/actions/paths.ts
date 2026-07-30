"use server";

import { type ActionResponseSchema } from "~/types";

import { encryptionService, gdrive } from "~/lib/utils.server";

import config from "config";

/**
 * Get file paths from the root folder to the file.
 * @param {string} fileName - The file name.
 * @param {string} parentId - The parent ID of the file.
 * @returns {string} - The file path.
 */
export async function GetFilePaths(fileName: string, parentId?: string): Promise<ActionResponseSchema<string>> {
  const decryptedRootId = await encryptionService.decrypt(config.apiConfig.rootFolder);
  if (!decryptedRootId)
    return { success: false, message: "Failed to decrypt root folder ID", error: "Failed to decrypt root folder ID" };

  const paths: string[] = [fileName];
  let parentIdTemp = parentId;
  while (parentIdTemp) {
    if (parentIdTemp === decryptedRootId) break;

    const { data } = await gdrive.files.get({
      fileId: parentIdTemp,
      fields: "id,name,parents",
      supportsAllDrives: config.apiConfig.isTeamDrive,
    });
    if (!data.name) break;

    paths.unshift(data.name);
    parentIdTemp = data.parents?.[0];
  }

  return { success: true, message: "File paths retrieved", data: paths.join("/") };
}

type PathFetch = {
  index: number;
  path: string;
  data: {
    id: string;
    parents?: string;
    mimeType: string;
  }[];
};
/**
 * Validate paths and return the ID of each path.
 * @param paths - The paths to validate.
 * @returns {ActionResponseSchema<{ id: string; path: string; mimeType: string; }[]>} - The validated paths.
 */
export async function ValidatePaths(
  paths: string[],
): Promise<ActionResponseSchema<{ id: string; path: string; mimeType: string }[]>> {
  const isSharedDrive = !!(config.apiConfig.isTeamDrive && config.apiConfig.sharedDrive);
  const decryptedRootId = await encryptionService.decrypt(config.apiConfig.rootFolder);
  const decryptedSharedDrive = isSharedDrive
    ? await encryptionService.decrypt(config.apiConfig.sharedDrive!)
    : undefined;

  const promises: Promise<PathFetch | null>[] = [];
  for (const [index, path] of paths.entries()) {
    // 1. PENCEGAH ERROR URL KACAU
    let decodedPath = path;
    try {
      decodedPath = decodeURIComponent(path);
    } catch (e) {
      // Biarkan jika sudah ter-decode atau aneh
    }

    // 2. TAMENG KARAKTER KHUSUS & SPASI SILUMAN
    const escapedPath = decodedPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escapedTrimmed = decodedPath.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    // 3. LOGIKA PINTAR: Cari yang persis SAMA, atau cari tanpa spasi berlebih
    const queryName = decodedPath !== decodedPath.trim() 
      ? `(name = '${escapedPath}' or name = '${escapedTrimmed}')` 
      : `name = '${escapedPath}'`;

    const list = gdrive.files
      .list({
        q: `${queryName} and trashed = false`,
        fields: "files(id, name, mimeType, parents)",
        ...(decryptedSharedDrive && {
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          driveId: decryptedSharedDrive,
          corpora: "drive",
        }),
      })
      .then(({ data }) => {
        if (!data.files?.length) return null;

        const object: PathFetch = {
          index,
          path,
          data: data.files.map((file) => ({
            id: file.id!,
            parents: file.parents?.[0],
            mimeType: file.mimeType!,
          })),
        };
        return object;
      })
      .catch((e) => {
        // 4. PEREDAM KEJUT BILA MENCARI FOLDER TERLALU DALAM (RATE LIMIT)
        console.error("[GDrive API Error]:", e);
        return null; 
      });
      
    promises.push(list);
  }

  const pathData = await Promise.all(promises);

  const invalidPathIndex = pathData.findIndex((p) => !p);
  if (invalidPathIndex !== -1)
    return {
      success: false,
      message: "Invalid path",
      error: `Failed to find path: ${paths[invalidPathIndex]}`,
    };
  const filteredPathData = pathData.filter((p) => p) as PathFetch[];

  let isValid = true;
  let invalidPath: string | undefined;
  const validatedPaths: PathFetch[] = [];

  for (const p of filteredPathData) {
    if (!isValid) break;
    if (!p.data.length) {
      isValid = false;
      invalidPath = p.path;
      break;
    }

    // 5. PELACAK LOKASI PASTI (Mencegah salah masuk folder bernama sama)
    let foundMatch = false;
    for (const item of p.data) {
      if (p.index === 0) {
        if (item.parents === decryptedRootId || item.parents === decryptedSharedDrive) {
          p.data = [item];
          validatedPaths.push(p);
          foundMatch = true;
          break;
        }
      } else {
        const previousPath = validatedPaths[p.index - 1];
        if (!previousPath) break;
        if (item.parents === previousPath.data?.[0]?.id) {
          p.data = [item];
          validatedPaths.push(p);
          foundMatch = true;
          break;
        }
      }
    }
    
    if (!foundMatch) {
      isValid = false;
      invalidPath = p.path;
    }
  }

  if (validatedPaths.length !== filteredPathData.length) {
    isValid = false;
    invalidPath = filteredPathData[validatedPaths.length]?.path;
  }
  if (!isValid)
    return {
      success: false,
      message: "Invalid path",
      error: invalidPath ? `Failed to validate path: ${invalidPath}` : "Failed when validating paths",
    };

  const response: { path: string; id: string; mimeType: string }[] = [];
  for (const item of validatedPaths) {
    response.push({
      id: await encryptionService.encrypt(item.data[0]?.id ?? ""),
      path: decodeURIComponent(item.path),
      mimeType: item.data[0]?.mimeType ?? "",
    });
  }

  return {
    success: true,
    message: "Paths validated",
    data: response,
  };
}
