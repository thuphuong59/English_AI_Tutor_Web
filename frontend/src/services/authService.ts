export const API_BASE_URL = "http://127.0.0.1:8000/api";


// Helper: Xử lý phản hồi và lỗi từ API
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let message = "An API error occurred";
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      console.error("Server returned non-JSON error");
    }
    console.error("API Error:", message);
    throw new Error(message);
  }
  return response.json();
};

export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(res);
  return data; // { id, email }
}

// Đăng nhập và lưu token VÀ ID
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(res);

  // LƯU TRỮ CHÍNH XÁC ID NGƯỜI DÙNG VÀO LOCALSTORAGE
  if (data.user?.id || data.id) {
    // Backend thường trả về {access_token, token_type, user: {id, email...}}
    const userId = data.user?.id || data.id; 
    localStorage.setItem("authenticatedUserId", userId);
  } else if (data.access_token) {
     // Nếu backend KHÔNG trả về ID trong lần đăng nhập, ta sẽ sử dụng token để lấy ID sau
     // Nhưng để fix lỗi ngay, chúng ta giả định ID có thể có trong data.id
     // Giữ logic cũ nếu không tìm thấy ID
  }
  
  // Lưu token & thời gian hết hạn
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("token_type", data.token_type || "bearer");
  document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`;

  return data;
}

// Lấy thông tin user hiện tại (qua token)
export const getCurrentUser = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    // Gọi backend để lấy user info từ DB
    const res = await fetch("http://127.0.0.1:8000/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch user profile");

    // Cập nhật ID người dùng sau khi lấy profile (HÀNH ĐỘNG KHÔI PHỤC)
    if (data.id) {
      localStorage.setItem("authenticatedUserId", data.id);
    }

    return data; // Dữ liệu từ bảng profiles + metadata
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
};

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("authenticatedUserId"); // Xóa ID khi đăng xuất
  document.cookie = "access_token=; Max-Age=0; path=/;";
  window.location.href = "/auth"; // Quay về trang login
}

// Kiểm tra trạng thái đăng nhập
export function isAuthenticated(): boolean {
  const token = localStorage.getItem("access_token");
  return !!token;
}

// Helper: Trả về header có token (cho các API cần xác thực)
export function authHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem("access_token");
  const headers: any = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json"; // chỉ thêm khi không phải FormData

  return headers;
}

export function authHeadersForm(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}