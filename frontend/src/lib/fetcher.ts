
const API_BASE_URL = "http://localhost:8000/api";

/**
 * Đây là hàm fetcher "thông minh" mới cho SWR.
 * Nó sẽ tự động đính kèm token từ localStorage.
 */
export const fetcher = async (url: string) => {
  // Lấy token từ localStorage
  const token = localStorage.getItem("access_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Gắn token vào header nếu nó tồn tại
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Gọi API (Lưu ý: url của SWR là /vocabulary/stats, 
  //    nên cần nối nó với API_BASE_URL)
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "GET",
    headers: headers,
  });

  // Xử lý lỗi
  if (!res.ok) {
    let message = "An API error occurred";
    try {
      const errorData = await res.json();
      message = errorData.detail || "Failed to fetch data";
    } catch {
    }
    console.error("SWR Fetcher Error:", message);
    throw new Error(message);
  }

  // Trả về dữ liệu JSON
  return res.json();
}; 