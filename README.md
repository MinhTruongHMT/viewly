# Viewly

Viewly là ứng dụng frontend lấy cảm hứng từ bố cục và trải nghiệm sử dụng YouTube, với tên và nhận diện riêng. Ứng dụng hỗ trợ máy tính, máy tính bảng và điện thoại; được xây dựng bằng React 19, TypeScript ở chế độ strict, Vite, Tailwind CSS 4, React Router, Lucide React và Zustand.

**Không cần backend, cơ sở dữ liệu hoặc API key để sử dụng các tính năng chính.** Video được phát bằng trình phát iframe chính thức của YouTube. Các bộ sưu tập và tùy chọn cá nhân được lưu trong trình duyệt bằng LocalStorage.

Viewly cũng hỗ trợ **video phổ biến thật, kết nối Google/YouTube với quyền chỉ đọc, video từ kênh đã đăng ký và gợi ý theo sở thích trong Viewly**. Các phần tích hợp này cần cấu hình Google Cloud như hướng dẫn ở mục 13; chế độ demo vẫn dùng được khi chưa cấu hình.

## 1. Yêu cầu môi trường

- **Node.js từ phiên bản 22.12 trở lên.** Dự án đã được kiểm tra với Node.js 22.23.0.
- npm đi kèm với Node.js.
- Trình duyệt hiện đại như Chrome, Edge, Firefox hoặc Safari.
- Kết nối Internet để tải thư viện khi cài đặt, ảnh thu nhỏ và nội dung video YouTube.
- Google Chrome đã cài trên máy nếu muốn chạy bộ kiểm thử trình duyệt với cấu hình hiện tại.

Tệp `.nvmrc` ghi phiên bản Node.js đã dùng để kiểm tra dự án. Tệp này không tự động thay đổi phiên bản Node.js trong mọi terminal; hãy kiểm tra phiên bản trước khi chạy.

```sh
node --version
npm --version
```

## 2. Cài đặt và chạy trên máy Windows hiện tại

Máy hiện tại có Node.js 14 làm phiên bản mặc định và có sẵn Node.js 22.23.0 tại `D:\nvm\v22.23.0`. Mở terminal PowerShell trong VS Code và chạy:

```powershell
Set-Location -LiteralPath 'D:\User\Source\youtube-clone'
$env:Path = 'D:\nvm\v22.23.0;' + $env:Path
node --version
npm.cmd install
npm.cmd run dev
```

Nếu các thư viện đã được cài đặt và `package.json` không thay đổi, bạn có thể bỏ qua bước `npm.cmd install`.

Sau khi Vite khởi động, mở địa chỉ ở dòng `Local`, thường là:

```text
http://localhost:5173
```

Nếu cổng 5173 đang được sử dụng, Vite có thể chọn một cổng khác. Hãy dùng đúng địa chỉ terminal hiển thị.

- Giữ terminal đang chạy để tiếp tục sử dụng ứng dụng.
- Mã nguồn được cập nhật lên trình duyệt khi bạn lưu các thay đổi.
- Nhấn **Ctrl + C** trong terminal để dừng máy chủ phát triển.

Lệnh thay đổi `Path` ở trên chỉ áp dụng cho terminal hiện tại, không đổi phiên bản Node.js toàn hệ thống. Khi mở terminal mới, hãy chạy lại lệnh đó nếu Node.js mặc định vẫn là phiên bản 14.

Sử dụng `npm.cmd` trong PowerShell để tránh lỗi chính sách thực thi đối với tệp `npm.ps1` chưa được ký. Không cần thay đổi chính sách thực thi PowerShell.

## 3. Cài đặt trên máy khác

Khi đã có Node.js phù hợp, mở terminal tại thư mục dự án và chạy:

```sh
npm install
npm run dev
```

Trên Windows PowerShell, bạn có thể dùng `npm.cmd` thay cho `npm` nếu gặp lỗi liên quan đến `npm.ps1`.

## 4. Các tính năng đã triển khai

- Trang chủ có **26 video mẫu**, lưới video thích ứng với kích thước màn hình, thời lượng, thông tin kênh, lượt xem giả lập và menu thao tác.
- Các bộ lọc: All, Music, Gaming, Programming, Technology, Live, Podcasts, Education và Other. Danh mục Other chứa các thể loại YouTube chưa có bộ lọc riêng trong Viewly; Programming và Podcasts được phân loại thêm từ tiêu đề hoặc thẻ của video.
- Thanh điều hướng bên trái có thể thu gọn trên máy tính; điện thoại sử dụng hộp thoại điều hướng. Trang đang mở được đánh dấu.
- Tìm kiếm theo tiêu đề, tên kênh và danh mục; không phân biệt chữ hoa/chữ thường; hỗ trợ phím Enter, xóa nội dung tìm kiếm và trạng thái không có kết quả.
- Trang `/watch?v=VIDEO_ID` có trình phát YouTube, thông tin kênh, đăng ký kênh, thích video, chia sẻ, lưu xem sau, lưu vào playlist, mô tả, bình luận mẫu và video gợi ý.
- Nhập video từ URL YouTube, đặt tiêu đề và tên kênh tùy chỉnh, chọn danh mục, xem trước ảnh thu nhỏ và ngăn nhập trùng.
- Xóa video đã nhập từ menu của video; đồng thời xóa video đó khỏi các bộ sưu tập đã lưu.
- Lưu video đã nhập, lượt thích, kênh đăng ký, danh sách xem sau, lịch sử, playlist và giao diện sáng/tối bằng LocalStorage.
- Lịch sử được ghi khi trình phát bắt đầu phát video. Có nút xóa lịch sử.
- Tạo và xóa playlist; thêm hoặc bỏ video khỏi playlist; mở từng playlist để xem các video bên trong.
- Trang Shorts có bố cục dọc, nút chuyển video trước/sau, thích, đăng ký kênh, bình luận mẫu và chia sẻ.
- Các trang Explore, Settings, thông báo không tìm thấy video và trang 404.
- Hỗ trợ thao tác bằng bàn phím, chỉ báo focus, liên kết bỏ qua điều hướng, nhãn cho các nút, hộp thoại có quản lý focus và chế độ giảm chuyển động.
- Khung chờ tải trang, trạng thái thư viện trống, thông báo thao tác và ảnh thay thế khi thumbnail không tải được hoặc không khả dụng.

**Thích, đăng ký kênh, lưu video và các thao tác tương tự chỉ là tính năng demo cục bộ. Chúng không tác động đến tài khoản YouTube thật.** Thông tin mô tả, lượt xem, ngày đăng và bình luận có thể là dữ liệu giả lập. Ứng dụng không thu thập metadata được bảo vệ.

## 5. Hướng dẫn sử dụng

### Duyệt và xem video

1. Mở trang Home để xem thư viện video.
2. Chọn một danh mục phía trên lưới để lọc video.
3. Bấm vào ảnh thu nhỏ hoặc tiêu đề để mở trang xem video.
4. Bấm phát trong trình phát YouTube. Video sẽ xuất hiện trong History khi nhận được sự kiện bắt đầu phát.
5. Dùng Show more để mở rộng mô tả và xem liên kết đến video gốc trên YouTube.

### Nhập video từ YouTube

1. Bấm **Import video** ở thanh trên cùng. Trên điện thoại, nút này có biểu tượng dấu cộng.
2. Dán URL đầy đủ, gồm `https://`.
3. Nhập **Video title** (tiêu đề video) và **Channel name** (tên kênh).
4. Chọn **Category** (danh mục).
5. Bấm **Import video** trong hộp thoại.
6. Mở Home: video vừa nhập nằm ở đầu danh sách khi bộ lọc All được chọn. Video vẫn được khôi phục sau khi tải lại trang.

Các định dạng URL được hỗ trợ:

```text
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/shorts/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://www.youtube.com/live/VIDEO_ID
https://www.youtube.com/watch?v=VIDEO_ID&t=42&list=PLAYLIST_ID
```

`VIDEO_ID` trong các ví dụ là ký hiệu minh họa; URL thực tế phải chứa ID YouTube hợp lệ gồm 11 ký tự. Ứng dụng dùng URL API, kiểm tra chính xác tên miền và định dạng ID. Các URL có thông tin đăng nhập, cổng không tiêu chuẩn, giao thức không hỗ trợ, cấu trúc sai hoặc video đã có trong thư viện sẽ bị từ chối.

Ảnh thu nhỏ được tạo từ URL thumbnail của YouTube. Tiêu đề, tên kênh và danh mục do bạn nhập được lưu cục bộ; ứng dụng không tự lấy metadata từ YouTube.

Để xóa video đã nhập, bấm menu ba chấm trên thẻ video và chọn **Remove import**. Video đó cũng được xóa khỏi danh sách thích, xem sau, lịch sử và các playlist có chứa nó.

### Tìm kiếm

- Nhập từ khóa vào ô tìm kiếm, rồi nhấn Enter hoặc bấm biểu tượng kính lúp. Khi đã cấu hình YouTube API key hoặc kết nối Google, ứng dụng mặc định tìm video trên YouTube.
- Chọn **YouTube** để tìm video công khai cho phép nhúng; bấm **Tải thêm kết quả** để xem trang tiếp theo. Lỗi API được hiển thị cùng nút thử lại.
- Chọn **Trong thư viện** để tìm trong video mẫu, video đã nhập và metadata đã tải. Khi chưa cấu hình API hoặc kết nối Google, đây là chế độ mặc định.
- Trên điện thoại, bấm biểu tượng kính lúp ở thanh trên cùng để mở ô tìm kiếm.
- Có thể tìm theo tiêu đề, tên kênh hoặc danh mục, ví dụ `React`, `music` hoặc `Fireship`.
- Bấm **Clear search** trên trang kết quả để xóa truy vấn tìm kiếm.

### Thích video, đăng ký kênh và lưu xem sau

- Bấm **Like** trên trang xem video để thích; bấm **Liked** để bỏ thích. Các video đã thích xuất hiện trong Liked videos.
- Bấm **Subscribe** để đăng ký kênh cục bộ; bấm **Subscribed** để bỏ đăng ký. Trang Subscriptions hiển thị video có trong thư viện thuộc các kênh đã đăng ký.
- Bấm **Watch later** trên trang xem video hoặc chọn **Save to Watch later** từ menu thẻ video. Bấm **Saved** hoặc chọn mục xóa tương ứng để bỏ lưu.

### Quản lý playlist

1. Mở Playlists trong thanh điều hướng.
2. Nhập tên rồi bấm **Create playlist**. Tên phải có từ 1 đến 80 ký tự và không trùng tên đã có, kể cả khi khác chữ hoa/chữ thường.
3. Trên trang xem video, bấm **Playlist**; hoặc mở menu của thẻ video và chọn **Add to playlist**.
4. Đánh dấu playlist muốn lưu video vào. Bỏ dấu chọn để xóa video khỏi playlist. Thay đổi được lưu tự động.
5. Bạn cũng có thể tạo playlist ngay trong hộp thoại chọn playlist; video đang chọn sẽ được thêm vào playlist mới.
6. Mở một playlist để xem nội dung, dùng **Remove from playlist** để bỏ video, hoặc bấm biểu tượng thùng rác ở trang danh sách playlist để xóa playlist.

### Shorts, giao diện và cài đặt

- Mở Shorts và dùng nút mũi tên để chuyển video trước/sau.
- Bấm biểu tượng mặt trăng hoặc mặt trời ở thanh trên cùng để đổi giao diện. Bạn cũng có thể đổi giao diện trong Settings.
- Trên máy tính, bấm biểu tượng menu để thu gọn hoặc mở rộng thanh điều hướng. Trên điện thoại, nút này mở hộp thoại điều hướng.
- Settings giải thích cách lưu dữ liệu và các giới hạn của trình phát.

## 6. Dữ liệu cục bộ và quyền riêng tư

Dữ liệu được lưu trong LocalStorage dưới khóa **`viewly-library`**, gồm:

- Video đã nhập.
- Danh sách video đã thích và lưu xem sau.
- Tên các kênh đã đăng ký.
- Lịch sử xem, tối đa 200 video gần nhất và không lặp ID.
- Các playlist và video trong từng playlist.
- Tùy chọn giao diện sáng hoặc tối.

Dữ liệu gắn với trình duyệt và địa chỉ đang dùng. Ví dụ, `localhost:5173` và `127.0.0.1:5173` có vùng lưu trữ riêng; đổi cổng cũng có thể làm bạn thấy một thư viện khác. Không có đồng bộ tài khoản giữa các thiết bị hoặc trình duyệt.

Xóa dữ liệu trang web trong trình duyệt sẽ xóa các bộ sưu tập cục bộ. Bình luận chỉ tồn tại trong phiên xem video và được đặt lại khi rời video; chúng không được lưu vào LocalStorage.

Ứng dụng lọc các mục đã lưu không hợp lệ và vẫn có thể khởi động khi JSON lưu trữ bị hỏng. Nếu không thể ghi dữ liệu do trình duyệt chặn hoặc vùng lưu trữ đầy, ứng dụng hiển thị thông báo; thay đổi khi đó chỉ tồn tại trong phiên hiện tại.

## 7. Build, kiểm tra mã nguồn và kiểm thử

Chạy trong thư mục dự án, với Node.js phù hợp:

```sh
npm run build
npm run lint
npm test
npm run test:e2e
```

Nếu dùng PowerShell trên máy hiện tại:

```powershell
$env:Path = 'D:\nvm\v22.23.0;' + $env:Path
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
```

| Lệnh               | Chức năng                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `npm run dev`      | Khởi động môi trường phát triển Vite.                                      |
| `npm run build`    | Kiểm tra kiểu TypeScript, sau đó tạo bản build trong `dist/`.              |
| `npm run lint`     | Kiểm tra quy tắc mã nguồn bằng ESLint.                                     |
| `npm test`         | Chạy các kiểm thử logic bằng Vitest.                                       |
| `npm run test:e2e` | Chạy các kiểm thử tương tác bằng Playwright trên bố cục desktop và mobile. |
| `npm run preview`  | Xem bản build đã tạo trên máy.                                             |

Bộ kiểm thử logic bao gồm kiểm tra URL, chống nhập trùng, dọn dữ liệu khi xóa video, thứ tự lịch sử, tên playlist và khôi phục dữ liệu lưu trữ.

Bộ kiểm thử trình duyệt dùng Google Chrome đã cài trên máy. Video, ảnh và các sự kiện của trình phát được giả lập để kiểm tra luồng tương tác, sự kiện phát và lỗi nhúng mà không phụ thuộc vào mạng hoặc tình trạng video bên ngoài. Việc các kiểm thử này thành công không xác nhận rằng mọi video YouTube đều cho phép phát tại thời điểm sử dụng.

Nếu muốn dùng Chromium do Playwright quản lý, hãy bỏ các cấu hình `channel: 'chrome'` trong `playwright.config.ts` rồi cài Chromium:

```sh
npx playwright install chromium
```

Trên Windows PowerShell, dùng `npx.cmd` nếu gặp lỗi chính sách thực thi.

Để chụp ảnh và kiểm tra bố cục bằng thumbnail thật, khởi động `npm run dev`, rồi mở terminal thứ hai tại thư mục dự án và chạy:

```sh
node scripts/visual-check.mjs
```

Script này cần Google Chrome và kết nối Internet; kiểm tra desktop, tablet, màn hình 320px, mobile, giao diện tối và hộp thoại nhập video. Ảnh được lưu trong `test-results/visual/`. Playwright có thể dọn thư mục `test-results/` ở lần chạy kiểm thử tiếp theo, nên hãy sao chép ảnh ra nơi khác nếu muốn giữ lại.

## 8. Xem bản build và triển khai

Tạo bản build rồi chạy xem thử:

```sh
npm run build
npm run preview
```

Mở địa chỉ terminal hiển thị. Lệnh preview dùng để kiểm tra bản build trên máy.

Khi triển khai lên dịch vụ hosting tĩnh, sử dụng nội dung thư mục `dist/`. Cấu hình hosting trả về `index.html` cho các đường dẫn của ứng dụng như `/watch`, `/shorts` và `/playlists/...`, để tải lại trang hoặc mở liên kết trực tiếp vẫn hoạt động.

Không cần triển khai backend; các tính năng demo không cần API key.

Riêng nguồn dữ liệu YouTube thật và kết nối Google cần cấu hình ở mục 13. Các biến `VITE_` được đưa vào mã phía trình duyệt khi build, nên phải cấu hình trước khi build bản triển khai.

## 9. Cấu trúc mã nguồn

```text
src/
  app/                  # Điểm vào ứng dụng và cấu hình định tuyến
  components/
    layout/             # Thanh trên cùng, thanh điều hướng, bố cục chính
    video/              # Thẻ video, lưới, trình phát và các nút thao tác
    import/             # Hộp thoại nhập video bằng URL
    ui/                 # Hộp thoại, avatar, thông báo, chọn playlist, trạng thái trống
  data/                 # Video mẫu, Shorts và bình luận mẫu
  hooks/                # Kết hợp video mẫu với video đã nhập
  pages/                # Các trang tương ứng với đường dẫn
  services/             # Tích hợp API iframe chính thức của YouTube
  store/                # Dữ liệu được lưu và trạng thái giao diện tạm thời
  styles/               # Tailwind, biến giao diện và bố cục responsive
  types/                # Các kiểu dữ liệu TypeScript dùng chung
  utils/                # Kiểm tra URL, định dạng dữ liệu và chia sẻ
scripts/                # Script chụp ảnh và kiểm tra bố cục
tests/                  # Kiểm thử tương tác trên trình duyệt
public/                 # Tài nguyên tĩnh và biểu tượng ứng dụng
```

## 10. Giới hạn của bản demo

- YouTube và người đăng video quyết định quyền nhúng, khả năng truy cập, giới hạn khu vực, giới hạn độ tuổi và quảng cáo. Khi nhận được lỗi của trình phát, ứng dụng hiển thị hướng dẫn cùng liên kết xem trên YouTube; phần mô tả cũng luôn có liên kết đến video gốc.
- URL hợp lệ không đảm bảo video tồn tại hoặc cho phép nhúng. Tính năng nhập video không kiểm tra điều này qua API và không lấy metadata được bảo vệ.
- Shorts dùng các clip demo công khai trong bố cục dọc; video gốc có thể là video ngang.
- Bình luận, hồ sơ người dùng và bảng thông báo là giao diện demo. Bình luận không được lưu sau khi rời video.
- Lượt xem, ngày đăng và thông tin mẫu có thể khác với dữ liệu trên YouTube.
- Kết nối Google/YouTube là tùy chọn, chỉ đọc dữ liệu. Không có đồng bộ thư viện Viewly giữa các thiết bị, và các nút Like/Subscribe/Watch later/Playlist trong Viewly không thay đổi tài khoản YouTube thật.
- Ảnh thu nhỏ, nội dung video và Google Fonts cần kết nối Internet. Có phông chữ hệ thống và ảnh thay thế khi tài nguyên không tải được; lỗi kết nối trình phát cũng có thông báo hỗ trợ.
- Chia sẻ dùng Web Share API hoặc sao chép liên kết vào clipboard khi trình duyệt cho phép. Nếu thao tác bị chặn, ứng dụng hướng dẫn dùng liên kết YouTube bên ngoài.

## 11. Xử lý lỗi thường gặp

| Hiện tượng                                    | Cách xử lý                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Vite báo phiên bản Node.js không phù hợp      | Kiểm tra `node --version`; trên máy hiện tại, thêm `D:\nvm\v22.23.0` vào `Path` của terminal như mục 2.                  |
| PowerShell báo không thể chạy `npm.ps1`       | Dùng `npm.cmd` thay cho `npm`; không cần đổi chính sách thực thi.                                                        |
| Không tải được các thư viện npm               | Kiểm tra kết nối mạng, proxy hoặc quyền truy cập `registry.npmjs.org`, rồi chạy lại `npm install`.                       |
| Trang không mở ở cổng 5173                    | Dùng đúng URL ở dòng `Local` do Vite hiển thị và giữ terminal đang chạy.                                                 |
| Nhập video báo URL không hợp lệ               | Dùng URL YouTube đầy đủ, kiểm tra tên miền và ID gồm 11 ký tự; đối chiếu các ví dụ ở mục 5.                              |
| Nhập video báo trùng                          | Video đã có trong dữ liệu mẫu hoặc đã được nhập; dùng tìm kiếm để tìm video đó.                                          |
| Video không phát trong ứng dụng               | Kiểm tra kết nối hoặc trình chặn nội dung; dùng liên kết Watch on YouTube nếu video không cho phép nhúng.                |
| Không thấy các video đã lưu                   | Kiểm tra trình duyệt, tên miền và cổng có giống lần lưu trước hay không; dữ liệu đã xóa không được đồng bộ để khôi phục. |
| Playwright không tìm thấy Chrome              | Cài Google Chrome hoặc chuyển cấu hình sang Chromium theo mục 7.                                                         |
| Tải lại đường dẫn con trên hosting bị lỗi 404 | Cấu hình hosting chuyển các đường dẫn ứng dụng về `index.html` theo mục 8.                                               |

## 12. Tài liệu tham khảo

- [API iframe chính thức của YouTube](https://developers.google.com/youtube/iframe_api_reference).
- [Hướng dẫn bắt đầu với Vite](https://vite.dev/guide/).
- [Cài đặt Tailwind CSS với Vite](https://tailwindcss.com/docs/installation/using-vite).

## 13. Cấu hình Google và YouTube API

### Các chế độ dữ liệu

| Nguồn                 | Cách hoạt động                                                                                                                | Cấu hình cần có                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Thư viện demo         | Video mẫu và các video bạn tự nhập; hoạt động như trước.                                                                      | Không cần khóa hoặc đăng nhập.                                                                   |
| Phổ biến trên YouTube | Gọi `videos.list` với `chart=mostPopular`, khu vực mặc định `VN`; có làm mới và tải thêm trang.                               | API key, hoặc phiên Google đã cấp quyền.                                                         |
| Từ tài khoản YouTube  | Đọc `subscriptions.list`, lấy playlist uploads của từng kênh, rồi lấy thông tin video công khai.                              | OAuth Client ID và người dùng cấp quyền `youtube.readonly`.                                      |
| Dành cho bạn          | Ưu tiên chủ đề đã chọn, video/kênh đã thích và lịch sử xem trong Viewly; giảm ưu tiên video đã xem và đa dạng người sáng tạo. | Xếp nội dung đã tải không cần khóa; tìm ứng viên mới trên YouTube cần API key hoặc phiên Google. |

**YouTube Data API không cung cấp danh sách đề xuất cá nhân giống trang chủ YouTube của tài khoản.** “Dành cho bạn” là hệ thống gợi ý riêng của Viewly. Không lấy cookie đăng nhập, không quét trang YouTube và không sử dụng endpoint không công khai.

### Bước 1: Tạo dự án Google Cloud và bật API

1. Mở [Google Cloud Console](https://console.cloud.google.com/) và tạo hoặc chọn một dự án của bạn.
2. Trong thư viện API, tìm **YouTube Data API v3** và bật API cho dự án.
3. Để dùng nguồn video phổ biến khi chưa đăng nhập, tạo **API key** trong phần thông tin xác thực.
4. Giới hạn khóa theo **Websites / HTTP referrers**, chỉ cho các địa chỉ bạn dùng, ví dụ `http://localhost:5173/*`, `http://127.0.0.1:5173/*` và tên miền triển khai của bạn.
5. Trong giới hạn API của khóa, chỉ cho phép **YouTube Data API v3**.

API key dùng cho web sẽ hiện diện trong trình duyệt. Tệp `.env.local` tránh đưa khóa vào mã nguồn được quản lý, nhưng không biến khóa frontend thành bí mật; hãy đặt giới hạn tại Google Cloud.

### Bước 2: Cấu hình OAuth cho đăng nhập Google

1. Trong Google Auth Platform của cùng dự án, cấu hình thông tin ứng dụng và màn hình đồng ý OAuth.
2. Nếu ứng dụng đang ở chế độ thử nghiệm, thêm tài khoản Google của bạn vào danh sách **Test users**.
3. Khai báo quyền `https://www.googleapis.com/auth/youtube.readonly`. Viewly cũng yêu cầu `openid`, `email` và `profile` để hiển thị tên và email khi được cấp quyền.
4. Tạo **OAuth Client ID** loại **Web application**.
5. Thêm các **Authorized JavaScript origins** tương ứng với địa chỉ chạy ứng dụng: `http://localhost:5173` và/hoặc `http://127.0.0.1:5173`. Origins không có đường dẫn hoặc ký tự `/*`.
6. Khi triển khai, thêm origin HTTPS chính xác của ứng dụng. Nếu đổi cổng Vite, cập nhật origin tương ứng.

Luồng hiện tại dùng popup của Google Identity Services, không có backend nhận authorization code. Không cấu hình Client Secret trong ứng dụng frontend. Khi phát hành rộng rãi, phạm vi truy cập dữ liệu người dùng có thể yêu cầu quy trình xác minh của Google.

### Bước 3: Tạo cấu hình cục bộ

Sao chép tệp mẫu trong thư mục dự án:

```powershell
Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
```

Chỉ thực hiện bước sao chép khi bạn chưa có `.env.local`, để tránh ghi đè cấu hình đã điền. Mở `.env.local` và thay các giá trị minh họa bằng thông tin dự án Google Cloud của bạn:

```dotenv
VITE_YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
VITE_YOUTUBE_REGION=VN
```

- Có thể chỉ cấu hình API key trước để xem video phổ biến.
- Có thể chỉ cấu hình OAuth Client ID; sau khi kết nối Google, access token có thể dùng để đọc dữ liệu công khai và danh sách kênh đăng ký.
- Khu vực dùng mã quốc gia gồm hai chữ cái viết hoa, ví dụ `VN`.
- Không đưa Client Secret, access token hoặc refresh token vào bất kỳ biến `VITE_` nào.
- Không gửi khóa hoặc token vào chat, không đưa `.env.local` vào kho mã nguồn. Dự án đã loại trừ các tệp `.env` khỏi Git, ngoại trừ `.env.example`.

Dừng Vite rồi khởi động lại sau khi thay đổi cấu hình:

```powershell
$env:Path = 'D:\nvm\v22.23.0;' + $env:Path
npm.cmd run dev
```

Mở Settings để xem trạng thái đã/chưa cấu hình, không hiển thị giá trị khóa.

### Bước 4: Sử dụng các tính năng mới

1. Trên Home, chọn **Phổ biến trên YouTube**. Bấm **Làm mới** để tải lại hoặc **Tải thêm video** để xem trang tiếp theo. Nguồn này sử dụng metadata thật, có nhãn YouTube trên thẻ video.
2. Mở nút tài khoản ở thanh trên cùng, Settings hoặc trang Subscriptions, rồi bấm **Kết nối Google** khi nút sẵn sàng. Chọn tài khoản tại popup chính thức của Google và cấp quyền chỉ đọc YouTube.
3. Mở Subscriptions và chọn **Từ tài khoản YouTube**. Mỗi lượt tải lấy tối đa 12 kênh và tối đa 4 video mới nhất mỗi kênh; bấm **Tải thêm kênh đã đăng ký** để lấy trang tiếp theo. Có bộ lọc kênh và nút làm mới.
4. Chọn **Theo dõi trong Viewly** để xem các kênh bạn đăng ký bằng nút Subscribe cục bộ như trước.
5. Trên Home, chọn **Dành cho bạn**, đánh dấu các sở thích. Thứ tự gợi ý cập nhật dựa trên lựa chọn và hoạt động trong Viewly. Bấm **Tìm video theo sở thích** để tìm ứng viên mới từ tối đa hai chủ đề ưu tiên trên YouTube.
6. Để dùng dữ liệu mẫu, chọn **Thư viện demo**. Lỗi API không tự động đổi nhãn của video mẫu thành video thật.

Tìm kiếm trên thanh trên cùng gọi YouTube API sau khi nhấn Enter hoặc bấm nút tìm kiếm khi đã cấu hình API key hoặc kết nối Google; không gọi API mỗi lần gõ phím. Có thể chuyển sang **Trong thư viện** để tìm cục bộ. Việc tìm ứng viên theo sở thích chỉ chạy khi bấm nút, nhằm hạn chế sử dụng quota.

### Phiên đăng nhập, dữ liệu và hạn mức

- Access token và hồ sơ Google chỉ được giữ trong bộ nhớ phiên, không lưu vào LocalStorage. Khi tải lại trang, kết nối lại để đọc dữ liệu tài khoản; cấu hình sở thích và thư viện cục bộ vẫn còn.
- Token hết hạn hoặc API trả 401 sẽ ngắt phiên và xóa danh sách kênh/video đăng ký của phiên khỏi giao diện. Bạn có thể kết nối lại từ tài khoản hoặc Settings.
- **Ngắt kết nối** kết thúc phiên tại Viewly. **Thu hồi quyền truy cập** còn gửi yêu cầu thu hồi token đến Google.
- Các kênh đăng ký của tài khoản không được lưu trong LocalStorage. Metadata video công khai chỉ được lưu khi bạn chủ động thích, lưu xem sau, lưu vào playlist hoặc phát video để ghi lịch sử.
- Metadata đã giữ dùng khóa `viewly-youtube-catalog`, giới hạn tối đa 400 mục và thời hạn 7 ngày. Các mục quá hạn bị bỏ; ứng dụng có thể tải lại metadata theo ID nếu có API key hoặc phiên Google hợp lệ. Video không còn công khai hoặc không nhúng được có thể không xuất hiện trong bộ sưu tập.
- Sở thích và nguồn video đã chọn được lưu trong `viewly-library` cùng thư viện cục bộ. Dữ liệu cục bộ dùng chung trong cùng trình duyệt/origin, không phải thư viện được đồng bộ hoặc tách riêng cho từng tài khoản Google.
- YouTube API có hạn mức. Viewly gộp tối đa 50 ID mỗi lần lấy chi tiết video, tải video kênh với số yêu cầu đồng thời có giới hạn và chỉ tìm tối đa hai chủ đề mỗi lần tìm theo sở thích. Khi hết quota, kiểm tra hạn mức dự án Google Cloud hoặc chuyển sang nguồn demo.
- Các giới hạn nhúng, khu vực và độ tuổi vẫn do YouTube quyết định. Bộ lọc API loại các video không công khai hoặc được đánh dấu không cho phép nhúng; trình phát vẫn xử lý lỗi phát thực tế.

### Kiểm thử tích hợp Google / YouTube

```powershell
$env:Path = 'D:\nvm\v22.23.0;' + $env:Path
npm.cmd test
npm.cmd run test:e2e
npm.cmd run test:e2e:api
npm.cmd run lint
npm.cmd run build
```

`test:e2e:api` dùng cấu hình riêng tại `playwright.api.config.ts`, chạy Vite trên cổng 5174 với Client ID/API key giả và chặn các yêu cầu Google/YouTube để trả dữ liệu kiểm thử. Các bài kiểm tra xác minh video thật theo cấu trúc API, phân trang, lưu metadata sau refresh, gợi ý theo sở thích, đăng nhập, đọc kênh đăng ký, ngắt kết nối, token 401 và lỗi quota trên desktop/mobile. Chúng không cần thông tin xác thực thật và không xác nhận đăng nhập thật đã thành công.

Để xác minh kết nối thật, hoàn thành cấu hình ở trên và đăng nhập thủ công bằng tài khoản thử nghiệm của bạn.

Tài liệu tích hợp: [Google Identity Services — token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [videos.list](https://developers.google.com/youtube/v3/docs/videos/list), [subscriptions.list](https://developers.google.com/youtube/v3/docs/subscriptions/list), [playlistItems.list](https://developers.google.com/youtube/v3/docs/playlistItems/list), [search.list](https://developers.google.com/youtube/v3/docs/search/list).
