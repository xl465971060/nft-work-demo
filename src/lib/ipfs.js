import axios from "axios";

// Pinata JWT 认证（.env 里的 REACT_APP_PINATA_JWT，eyJ 开头）
const jwt = process.env.REACT_APP_PINATA_JWT;

const authHeaders = () => ({
  Authorization: `Bearer ${jwt}`,
});

// 上传 JSON 元数据
export const uploadJSONToIPFS = async (jsonBody) => {
  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      jsonBody,
      { headers: authHeaders() }
    );
    return {
      success: true,
      pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
    };
  } catch (error) {
    console.error("Pinata JSON upload error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.error?.details || error.message };
  }
};

// 上传图片文件
export const uploadFileToIPFS = async (file) => {
  try {
    const data = new FormData();
    data.append("file", file);
    const metadata = JSON.stringify({ name: file.name || "nft-image" });
    data.append("pinataMetadata", metadata);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
          ...authHeaders(),
        },
      }
    );
    return {
      success: true,
      pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
    };
  } catch (error) {
    console.error("Pinata file upload error:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.error?.details || error.message };
  }
};
