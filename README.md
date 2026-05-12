## Nhóm

1. Vũ Đình Trường
Mã sinh viên : 23810310307
2. Đào Huy Sơn
Mã sinh viên : 23810310310
3. Nguyễn Đức Nam
Mã sinh viên : 22810310057

## Phân công công việc
 1. Vũ Đình Trường ( Lên ý tưởng + backend + Thiết kế UX/UI) 
Mã sinh viên : 23810310307
2. Đào Huy Sơn (Thiết kế UX/UI)
Mã sinh viên : 23810310310
3. Nguyễn Đức Nam (làm báo cáo)
Mã sinh viên : 22810310057

# 📚 BiblioSphere – Full Stack (JS)

```
BiblioSphere/
├── backend/                  ← Express.js + SQLite
│   ├── src/
│   │   ├── index.js          ← Entry point (server)
│   │   ├── db/
│   │   │   └── init.js       ← Khởi tạo DB + tạo bảng
│   │   ├── middleware/
│   │   │   └── auth.js       ← JWT middleware
│   │   └── routes/
│   │       ├── auth.js       ← Đăng nhập / đăng ký
│   │       ├── books.js      ← CRUD sách
│   │       ├── members.js    ← CRUD bạn đọc
│   │       ├── borrows.js    ← Mượn / Trả
│   │       └── reports.js    ← Báo cáo + Settings
│   ├── .env
│   └── package.json
│
└── mobile/                   ← Expo SDK 54 + expo-router
    ├── app/
    │   ├── _layout.jsx       ← Root layout
    │   ├── index.jsx         ← Redirect theo auth
    │   ├── auth/
    │   │   └── login.jsx     ← Màn hình đăng nhập
    │   └── (tabs)/
    │       ├── _layout.jsx   ← Bottom tab bar
    │       ├── index.jsx     ← Dashboard
    │       ├── books.jsx     ← Quản lý sách
    │       ├── members.jsx   ← Bạn đọc
    │       ├── borrows.jsx   ← Mượn/Trả
    │       └── reports.jsx   ← Báo cáo
    ├── components/UI.jsx
    ├── services/api.js
    ├── hooks/useAuth.js
    ├── constants/theme.js
    └── package.json
```

---

## 🚀 Cài đặt & Chạy

### Backend

```bash
cd backend
npm install
npm run dev
# Server chạy tại http://localhost:8000
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

### Đổi IP cho điện thoại thật
Mở `mobile/services/api.js`, sửa:
```js
// Tìm IP máy tính: ipconfig (Windows)
export const API_BASE = 'http://192.168.x.x:8000';
```
Backend cũng cần chạy với `--host 0.0.0.0` (đã có sẵn trong code).

---

## Tài khoản mặc định
- **Username:** `admin`
- **Password:** `admin123`

## Công nghệ sử dụng

### Backend `/backend`
| Thư viện | Vai trò |
|---|---|
| `express` | Framework API |
| `better-sqlite3` | Database SQLite |
| `bcryptjs` | Mã hóa mật khẩu |
| `jsonwebtoken` | Xác thực JWT |
| `cors` | Quản lý CORS |
| `dotenv` | Biến môi trường |
| `node-cron` | Tác vụ định kỳ |

### Mobile `/mobile`
| Thư viện | Vai trò |
|---|---|
| `expo` ~52 | Framework Expo SDK |
| `expo-router` | File-based routing |
| `expo-linear-gradient` | Hiệu ứng gradient |
| `expo-secure-store` | Lưu token bảo mật |
| `@react-native-async-storage` | Lưu trữ local |
#
## 📸 Hình ảnh hoàn thiện

### Màn hình Đăng nhập
![Màn hình Đăng nhập](<ảnh/Login.jpg>)

### Màn hình Dashboard
![Màn hình Dashboard](<ảnh/Dashboard.jpg>)

### Màn hình Quản lý sách
![Màn hình Quản lý sách](<ảnh/Book.jpg>)

### Màn hình thêm sách
![Màn hình thêm sách](<ảnh/Addbook.jpg>)

### Màn hình Quản lý người đọc
![Màn hình Quản lý người đọc](<ảnh/member.jpg>)

### Màn hình thêm người đọc
![Màn hình thêm người đọc](<ảnh/Addmember.jpg>)

### Màn hình Mượn trả sách
![Màn hình Mượn trả sách](<ảnh/Borrow.jpg>)

### Màn hình thêm phiếu mượn sách
![Màn hình thêm phiếu mượn sách](<ảnh/borrowticket.jpg>)

### Màn hình Báo cáo
![Màn hình Báo cáo](<ảnh/report.jpg>)

## Link video demo
https://drive.google.com/file/d/1iF2pQHK3TKHLRpU5Rsy92ll4zeB2wCVX/view?usp=drive_link