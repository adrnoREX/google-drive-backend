import { supabase } from "../config/supabaseClient.js";
import { v4 as uuidv4 } from 'uuid';

// Upload Files
export const uploadfile =  async (req, res) => {
  const files = req.files;
  const parentId = req.body.parentId || "root";

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  if (parentId !== "root") {
    const { data: folderCheck, error: folderError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", parentId)
      .single();

    if (folderError || !folderCheck) {
      return res.status(400).json({ error: "Invalid parent folder" });
    }
  }

  const uploadResults = [];

  for (const file of files) {
    try {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("my-bucket")
        .upload(`uploads/${uniqueName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (storageError) {
        console.error("Storage error:", storageError.message);
        return res.status(400).json({ error: storageError.message });
      }

      const { data: inserted, error: dbError } = await supabase
        .from("files")
        .insert([
          {
            storage_path: storageData.path,
            display_name: file.originalname,
            uploaded_by: null,
            size: file.size,
            mime_type: file.mimetype,
            folder_id: parentId === "root" ? null : parentId,
          },
        ])
        .select();

      if (dbError) {
        console.error("DB error:", dbError.message);
        return res.status(400).json({ error: dbError.message });
      }

      uploadResults.push(inserted[0]);
    } catch (err) {
      console.error("Unexpected error:", err.message);
      return res.status(500).json({ error: "Upload failed" });
    }
  }

  return res.json({ uploaded: uploadResults });
};

// Fetch Files
export const fetch = async (req, res) => {
  try {
    
    const folderId = req.query.folderId || null;

    let query = supabase
      .from("files")
      .select("*")
      .order("id", { ascending: true })
      .eq("is_deleted", false);

    if (folderId && folderId !== "root") {
      
      query = query.eq("folder_id", folderId);
    } else {
      
      query = query.is("folder_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all files in Trash 
export const trash = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("is_deleted", true) 
      .order("updated_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Error fetching trash files:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Preview 
export const preview = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: file, error: dbError } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (dbError || !file) {
      return res.status(404).json({ error: "File not found in DB" });
    }

    const { data, error } = await supabase.storage
      .from("my-bucket")
      .download(file.storage_path);

    if (error) {
      return res.status(404).json({ error: "File not found in Storage" });
    }

    res.setHeader("Content-Type", file.mime_type);
    res.send(Buffer.from(await data.arrayBuffer()));
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Empty Trash for Files (Hard Delete)
export const empty = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("files")
      .delete()
      .eq("is_deleted", true)
      .select("*"); 

    if (error) throw error;

    res.json({ 
      message: "Trash emptied", 
      deletedCount: data ? data.length : 0 
    });
  } catch (err) {
    console.error("Error emptying file trash:", err);
    res.status(500).json({ error: "Failed to empty file trash" });
  }
};


// Rename a file 
export const rename =  async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;

  const { data, error } = await supabase
    .from("files")
    .update({ display_name: newName, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "File renamed successfully", file: data[0] });
};

// Soft delete a file
export const del =  async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("files")
    .update({ is_deleted: true, updated_at: new Date() })
    .eq("id", Number(id))
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "File moved to trash", file: data[0] });
};

// Download a file
export const download = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: file, error } = await supabase
      .from("files")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !file) {
      return res.status(404).json({ error: "File not found in DB" });
    }

    const { data, error: downloadError } = await supabase.storage
      .from("my-bucket")
      .download(file.storage_path);

    if (downloadError) {
      console.error("❌ Tried to fetch:", file.storage_path);
      return res.status(404).json({ error: "File not found in storage" });
    }

    const buffer = await data.arrayBuffer();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.display_name}"`
    );
    res.setHeader("Content-Type", file.mime_type);
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Make a copy of a file
export const copy = async (req, res) => {
  const { id } = req.params;

  const { data: originalFile, error: fetchError } = await supabase
    .from("files")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) return res.status(400).json({ error: fetchError.message });

  const newPath = `uploads/${Date.now()}-${originalFile.display_name}`;

  const { error: copyError } = await supabase.storage
    .from("my-bucket")
    .copy(originalFile.storage_path, newPath);

  if (copyError) return res.status(400).json({ error: copyError.message });

  const { data: newFile, error: insertError } = await supabase
    .from("files")
    .insert([
      {
        storage_path: newPath,
        display_name: originalFile.display_name,
        uploaded_by: originalFile.uploaded_by,
        size: originalFile.size,
        mime_type: originalFile.mime_type,
        is_deleted: false,
        folder_id: originalFile.folder_id || null,
      },
    ])
    .select();

  if (insertError) return res.status(400).json({ error: insertError.message });

  res.json({ message: "File copied successfully", file: newFile[0] });
};

// Restore a soft-deleted file
export const restore = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("files")
    .update({ is_deleted: false, updated_at: new Date() })
    .eq("id", Number(id))
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "File not found" });

  res.json({ message: "File restored successfully", file: data[0] });
};

//Create share link
export const share = async (req, res) => {

  const fileId = req.body.fileId ?? req.body.file_id;
  const isPublic = req.body.isPublic ?? req.body.is_public;
  const sharedWith = req.body.sharedWith ?? req.body.shared_with;
  const createdBy = req.body.createdBy ?? req.body.created_by;
  const expiresAt = req.body.expiresAt ?? req.body.expires_at;

  try {
    const token = uuidv4();

    const { data, error } = await supabase
      .from("shares")
      .insert([
        {
          share_token: token,
          file_id: fileId,
          is_public: isPublic || false,
          shared_with: sharedWith || null,
          created_by: createdBy,
          expires_at: expiresAt || null,
        },
      ])
      .select("share_token");

    if (error) throw error;

    const link = `http://localhost:8800/share/${token}`;
    res.json({ success: true, link });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to create share link" });
  }
};

//Check access and serve file
export const access = async (req, res) => {
  const { token } = req.params;

  try {
    const { data: shares, error } = await supabase
      .from("shares")
      .select("*, files(display_name, storage_path, mime_type)")
      .eq("share_token", token)
      .maybeSingle();

    if (error || !shares) {
      return res.status(404).json({ error: "Invalid or expired link" });
    }

    const share = shares;

    if (share.expires_at && new Date() > new Date(share.expires_at)) {
      return res.status(403).json({ error: "Link expired" });
    }

    if (!share.is_public) {
      const userEmail = req.user?.email;

      if (!userEmail) {
        return res.status(403).json({ error: "User email missing in token" });
      }

      let allowedUsers = [];
      if (Array.isArray(share.shared_with)) {
        allowedUsers = share.shared_with;
      } else if (typeof share.shared_with === "string") {
        allowedUsers = share.shared_with.split(",").map((e) => e.trim());
      }

      if (!allowedUsers.includes(userEmail)) {
        return res.status(403).json({ error: "You do not have permission" });
      }
    }

    res.json({
      fileName: share.files.display_name,
      mimeType: share.files.mime_type,
      storagePath: share.files.storage_path,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shared file" });
  }
};

// Search 
export const search = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.json([]);
  }

  try {
    const { data, error } = await supabase
      .from("files")
      .select("id, display_name, mime_type, size, created_at")
      .ilike("display_name", `%${q}%`) 
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};