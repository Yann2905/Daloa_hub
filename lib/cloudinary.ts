/**
 * Upload non signe vers Cloudinary depuis le navigateur.
 * Utilise le cloud name et l'upload preset publics (NEXT_PUBLIC_*).
 * Retourne l'URL securisee (https) du fichier.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "daloa-hub",
): Promise<string> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error("Cloudinary non configure (cloud name / upload preset).");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error("Echec de l'upload Cloudinary : " + detail);
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
