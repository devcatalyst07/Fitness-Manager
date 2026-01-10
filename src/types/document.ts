export interface Document {
  _id: string;
  fileName: string;
  fileUrl: string; // required
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
  projectId?: {
    _id: string;
    projectName: string;
  };
}
