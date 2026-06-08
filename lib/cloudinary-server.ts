import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary cote serveur (cle secrete) : sert a
 *  - signer les uploads de documents PRIVES (CNI, vehicule) en mode
 *    "authenticated" (jamais accessibles publiquement) ;
 *  - generer des URLs de consultation signees et temporaires pour l'admin.
 */
function configure() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const DOC_FOLDER = "daloa-hub/documents";

/** Parametres signes pour un upload de document prive (mode authenticated). */
export function signDocumentUpload() {
  configure();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) {
    throw new Error("Cloudinary (cle serveur) non configure.");
  }
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: DOC_FOLDER, timestamp, type: "authenticated" };
  const signature = cloudinary.utils.api_sign_request(params, secret);
  return { cloudName, apiKey, timestamp, folder: DOC_FOLDER, type: "authenticated", signature };
}

/**
 * URL de consultation signee (valable ~5 min) d'un document prive.
 * Si `ref` est deja une URL http (donnees de demo), on la renvoie telle quelle.
 */
export function signedDocumentUrl(ref: string): string {
  if (/^https?:\/\//.test(ref)) return ref;
  configure();
  return cloudinary.url(ref, {
    type: "authenticated",
    resource_type: "image",
    secure: true,
    sign_url: true,
    expires_at: Math.round(Date.now() / 1000) + 300,
  });
}
