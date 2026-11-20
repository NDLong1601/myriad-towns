# Myriad Towns

Game city builder gốc chạy trên trình duyệt: thế giới sinh thủ tục vô hạn, công trình nâng cấp hoặc suy thoái theo
những gì nằm trong bán kính quanh nó. Chơi được trên máy (local) và deploy tĩnh lên GitHub Pages.

Chơi thử: https://ndlong1601.github.io/myriad-towns/

![Một ngôi làng đang lớn: nhà lều nâng cấp thành nhà gỗ quanh giếng, ruộng dâu, bản đồ nhỏ góc phải](docs/images/hero.jpg)

> Trạng thái: **M6 xong** và đang chỉnh theo góp ý trước M7: giao diện (xong), kinh tế và hạ tầng, người dân và phương tiện (tiếp theo). Lộ trình ở cuối trang.

## Có gì trong game

### Thế giới vô hạn và công trình sống theo láng giềng

Bản đồ sinh từ seed, đi mãi không hết: đồng cỏ, rừng, núi, thảo nguyên, vùng lạnh, bãi biển, phế tích. Mỗi công trình
tự nâng cấp khi đủ điều kiện xung quanh (ví dụ Lều tranh gần giếng thành Nhà gỗ) và xuống cấp nếu thiếu, luôn có cảnh
báo trước. Bấm vào một công trình để xem **"Vì sao?"**: nó cần gì, còn thiếu gì. Phím 1–0 bật **bản đồ nhiệt** để thấy
vùng phủ của nước, dịch vụ, ô nhiễm...

![Bản đồ nhiệt nước sạch quanh hai giếng](docs/images/heatmap.jpg)

### Hai chế độ chơi

Màn hình ván mới cho chọn **Mục tiêu** hoặc **Sandbox**, nhập seed (hoặc 🎲 ngẫu nhiên), bật hướng dẫn cho người mới,
hoặc **Tiếp tục** ván gần nhất.

![Màn hình ván mới](docs/images/new-game.jpg)

- **Mục tiêu**: 5 chương. Xong mỗi chương được thưởng tài nguyên, và từ chương 2 được **chọn 1 trong 2 gói công
  trình** (thương mại, thủ công, học thuật, tín ngưỡng, công nghiệp). Gói không chọn sẽ được đề xuất lại sau.
- **Sandbox**: mở khoá mọi công trình, xây miễn phí, tắt xuống cấp; bật tắt được ngay trong ván.

![Hoàn thành chương: chọn một gói công trình](docs/images/pack-choice.jpg)

### Nhiều thị trấn

Công trình đầu tiên lập thị trấn thứ nhất. Mỗi thị trấn có **lãnh thổ** (đường viền trên mặt đất) lớn dần theo dân số;
ở chế độ Mục tiêu chỉ xây được trong lãnh thổ. Muốn mở rộng xa hơn thì xây **Toà thị chính** (cần 1 Hiến chương) cách
các thị trấn khác ít nhất 64 ô. Bảng Thị trấn ở cột trái cho bay tới từng nơi; thị trấn ở xa camera chỉ chạy tóm tắt
sản xuất cho nhẹ máy. **Di tích** vàng rải trên bản đồ: xây gần là khám phá được và nhận thưởng.

![Hai thị trấn với đường viền lãnh thổ](docs/images/towns.jpg)

### Hướng dẫn cho người mới

Bảy bước ngắn ở cột trái (di chuyển, làm đường, đặt nhà, lương thực, giếng, xem "Vì sao?"), mỗi bước tự xong khi bạn
làm; bỏ qua được bất cứ lúc nào.

![Hướng dẫn bước 1](docs/images/tutorial.jpg)

### Lưu ván và cài đặt

- **💾 Lưu** hoặc Ctrl+S; tự lưu mỗi 2 phút và khi rời tab. Đóng tab mở lại là chơi tiếp.
- Nhiều bản lưu trong trình duyệt; **xuất/nhập** file `.mtsave` để chuyển máy hoặc gửi bạn bè.
- **⚙ Cài đặt**: chất lượng đồ hoạ, tầm nhìn, ngôn ngữ (Tiếng Việt / English), âm lượng, ngày đêm, tự lưu.

| Lưu và tải                                  | Cài đặt                                   |
| ------------------------------------------- | ----------------------------------------- |
| ![Danh sách bản lưu](docs/images/saves.jpg) | ![Menu cài đặt](docs/images/settings.jpg) |

### Ngày đêm, âm thanh và cảm giác xây

- **Ngày đêm theo giờ trong game**: một ngày là 10 phút chơi ở tốc độ ×1, dừng game thì trời cũng dừng. Bình minh và hoàng hôn ngả cam, đêm xanh tối nhưng vẫn nhìn rõ công trình. Tắt trong ⚙ nếu muốn trời luôn sáng.
- **Âm thanh tự tổng hợp** (không tải file nào): tiếng "cộc" khi xây, tiếng sỏi khi kéo đường, tiếng đổ khi phá, chuông khi nâng cấp, hợp âm khi xong chương hay lập thị trấn, tiếng "bíp bíp" khi không đặt được.
- **Âm nền theo nơi camera nhìn**: chim hót ban ngày, dế kêu ban đêm, nước chảy gần sông hồ, tiếng ồn phố khi đông nhà, gió to hơn khi zoom xa.
- Nút **🔊/🔇** ở cột trái tắt tiếng (nhớ cho lần sau); âm lượng chỉnh trong ⚙ và nghe thử ngay khi kéo.
- Công trình mới **"nảy" lên** khi đặt và khi nâng cấp, thay vì hiện ra cứng đơ.

![Cùng một làng lúc trưa, hoàng hôn và nửa đêm](docs/images/day-night.jpg)

### Hạ tầng, đường nâng cấp và công nghiệp

- **Cầu gỗ và cầu đá** bắc qua sông hồ: đặt trên nước, phải nối với đường (cách tối đa 1 ô). Kéo chuột để làm một đoạn cầu liền.
- **Đường nâng cấp theo khu dân cư**: đường đất ở gần nhà gỗ tự lát đá, khu đông đúc (nhà phố, biệt thự) tự lát gạch. Mức "Đô thị hoá" là một bản đồ nhiệt mới (chọn trong ô Bản đồ nhiệt). Đường đá và đường lát gạch cũng xây tay được, đều tính là đường cho mọi điều kiện.
- **Tháp nước**: nước sạch phủ rộng hơn giếng.
- **6 công trình công nghiệp mới**: Hố sỏi, Trạm giao thương, Cối xay gió, Nhà máy điện, Xưởng đúc và Nhà máy. Chuỗi: quặng → lò nung → xưởng đúc (kim loại), điện từ cối xay gió hoặc nhà máy điện, rồi Nhà máy làm ra nhiều hàng hoá.
- **Dễ chơi hơn ở biome thiếu đá**: Hố sỏi xây ở bất cứ đâu và ra đá chậm; Trạm giao thương đổi lương thực lấy đá và gỗ; mỏ đá chỉ cần 1 ô đá thay vì 2; tài nguyên khởi đầu tăng (lương thực 150, gỗ 300, đá 200).

![Cầu gỗ qua hồ, đường đá và đường lát gạch](docs/images/bridge.jpg)

![Công trình công nghiệp mới trong menu Sản xuất](docs/images/industry-menu.jpg)

### Thành phố sống động: người đi lại và phương tiện

- **Dân số tăng thì đường phố đông lên**: cứ khoảng 5 dân có 1 người đi bộ, tối đa vài chục người quanh khu bạn đang xem. Họ đi bên lề đường, rẽ ở ngã tư, quay đầu ở cuối đường và đi qua cả cầu.
- **Phương tiện đổi theo thời đại**: xe kéo tay từ khoảng 40 dân, xe ngựa từ 120 dân, ô tô từ 300 dân và xe buýt từ 700 dân. Ô tô cần có đường lát đá hoặc gạch (ít nhất 5% số đường), xe buýt cần ít nhất 15%; đường đất chỉ có xe kéo và xe ngựa.
- **Chỉ là hiệu ứng nhìn**: không ảnh hưởng mô phỏng, chỉ xuất hiện gần camera nên bản đồ lớn không chậm đi; mỗi loại là một lệnh vẽ. Tắt bằng mục "Người đi lại và phương tiện" trong Cài đặt hoặc thêm `?traffic=0` vào địa chỉ.

![Người đi bộ, xe kéo tay và xe ngựa trên đường của một làng 416 dân](docs/images/traffic.jpg)

![Cận cảnh](docs/images/traffic-close.jpg)

### Bố cục gọn hơn và địa hình phẳng

- **Tài nguyên xếp dọc** ở góc trên bên phải, mỗi loại một dòng có icon, số lượng và tốc độ thay đổi, nên khi có nhiều loại tài nguyên cũng không bị tràn ngang hay che các bảng khác. Panel chi tiết công trình dời sang bên trái cột này.
- **Bản đồ nhỏ (minimap) ở góc trái dưới**, chỗ bản đồ nhiệt trước đây; **bản đồ nhiệt chuyển sang góc phải dưới**.
- **Nút bật/tắt** cho cả hai: nút 🗺 (hoặc phím M) cho minimap, nút 🔥 cho bản đồ nhiệt. Lựa chọn được nhớ cho lần chơi sau; `?minimap=0` tắt minimap lúc mở game.
- **Địa hình phẳng** (mặc định): đất liền vẽ ở một độ cao, nên đường, nhà và xe không còn bị "khớp" bậc thang; cầu nằm ngang với đường hai bờ. Đồi núi vẫn còn trong luật chơi (quặng, đá) và thể hiện bằng màu đá, tuyết. Muốn bản đồ có đồi như trước: tắt "Địa hình phẳng" trong Cài đặt (cần tải lại trang) hoặc thêm `?terrain=hills`.

![Tài nguyên dọc, minimap bên trái, bản đồ nhiệt bên phải, đất phẳng](docs/images/layout.jpg)

### Giao diện: icon tài nguyên, ảnh công trình, panel chi tiết

- **Icon cho mọi loại tài nguyên** (lương thực, gỗ, đá, quặng, kim loại, hàng hoá, điện, tri thức, hiến chương, lao động). Icon vẽ bằng SVG ngay trong game, thanh tài nguyên và giá xây đều dùng icon; rê chuột vào icon để xem tên.
- **Menu xây có ảnh từng công trình**: ảnh được dựng từ chính mô hình 3D của game.
- **Panel bên phải**: chọn một công trình trong menu, hoặc bấm vào công trình đã xây, panel hiện ảnh lớn, chi phí, chỗ ở, sản xuất, tiêu hao, điều kiện (✓/✗) và **cấp tiếp theo** (ảnh cùng điều kiện để nâng cấp). Với công trình đã xây còn có mục "Trạng thái" và nút Phá dỡ. Thẻ nhỏ theo con trỏ vẫn cho biết đặt được hay không ở ô đang chỉ.

![Chọn Lều tranh: ảnh trong menu, panel bên phải, thẻ theo con trỏ](docs/images/ui-build.jpg)

![Bấm vào một nhà gỗ đã xây: trạng thái, điều kiện, cấp tiếp theo](docs/images/ui-inspect.jpg)

| Thanh tài nguyên                                 | Menu xây                                |
| ------------------------------------------------ | --------------------------------------- |
| ![Icon tài nguyên](docs/images/ui-resources.jpg) | ![Menu có ảnh](docs/images/ui-menu.jpg) |

### Đường tự nối, đèn đêm và trang trí

- **Đường tự nối:** đường nhìn thấy láng giềng và tự đổi hình: đoạn thẳng có vạch giữa, góc, ngã ba, ngã tư, đường cụt. Phá một ô thì các ô quanh nó đổi lại ngay.
- **Đèn đường** ở ngã ba, ngã tư và đầu đường cụt.
- **Cửa sổ sáng đèn về đêm** trên nhà, toà nhà và hội trường. Công trình bị bỏ hoang thì tối om.
- **Nhà có vườn nhỏ:** hàng rào cây và mảng hoa.

![Đường tự nối, ban ngày](docs/images/roads.jpg)

![Cùng khu đó về đêm: đèn đường và cửa sổ sáng](docs/images/night.jpg)

### Chuỗi Nhà hát: công trình chi tiết hơn

Nhóm Văn hóa có thêm chuỗi Nhà hát 2×2 ba cấp, dựng chi tiết hơn các nhóm trước: **Sân khấu ngoài trời** → **Nhà hát gạch** → **Nhà hát lớn**. Sân khấu lên Nhà hát gạch khi có đường lát, khu đô thị (≥ 3) và thương mại (≥ 2). Nhà hát gạch lên Nhà hát lớn khi đô thị ≥ 6, giáo dục ≥ 2 và không ô nhiễm. Nếu mất điều kiện, công trình xuống cấp lại.

- Mái hông có hàng ngói và gờ nóc. Cửa sổ lõm vào tường, có khung, song kính, bậu và đá đỉnh vòm.
- Cột cổ điển, mái đua có hàng răng cưa, tầng trệt đá đẽo rãnh, mái vòm đồng có gân và đèn lồng.
- Cây nhiều tầng tán, đèn đường, cột quảng cáo và người nhỏ để thấy tỉ lệ.
- Bóng tiếp đất và màu lệch nhẹ giữa các khối được nung vào màu đỉnh, nên không tốn thêm lượt vẽ.

![Chuỗi Nhà hát trong thị trấn](docs/images/theatre-town.jpg)

| ![Ba cấp Nhà hát](docs/images/theatre-chain.jpg) | ![Nhà hát lớn](docs/images/theatre-opera.jpg) |
| ------------------------------------------------ | --------------------------------------------- |

![Chuỗi Nhà hát về đêm](docs/images/theatre-night.jpg)

Xem thử một công trình bất kỳ khi chạy `npm run dev`: `/tools/building-preview.html?ids=open_air_stage,playhouse,opera_house&yaw=35` (thêm `&night=1` cho cảnh đêm).

### Nhóm 5: Nông nghiệp, Thực phẩm, Chăn nuôi và Ngư nghiệp

Năm chuỗi công trình lương thực được dựng lại theo phong cách sa bàn chi tiết: tường ghép từng tấm ván, từng viên gạch đá, mái lợp từng viên ngói, cửa sổ có chớp và chậu hoa, cùng người, bò, ngựa, hươu, chó săn, thuyền, xe kéo và đạo cụ. Mỗi cấp mở khóa khi khu đô thị xung quanh lên mức cao hơn và xuống cấp lại nếu mất điều kiện.

| Chuỗi                              | Cấp                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nông trại (2×2, 7 cấp)             | Nông trại lúa mì → Ruộng lúa mì tưới tiêu → Trang viên cối xay gió (đô thị ≥ 1) → Nông trang cơ giới hóa (≥ 3) → Đại điền trang hoàng gia (≥ 5) → Tổ hợp nông nghiệp công nghệ cao (≥ 6) → Nông trại thẳng đứng sinh thái (≥ 8) |
| Vườn quả và rượu vang (2×2, 5 cấp) | Ruộng dâu → Vườn rau ven phố (≥ 2) → Trang viên vườn quả (≥ 3) → Nông trang nho và xưởng rượu (≥ 5) → Lâu đài rượu vang Chateau (≥ 7)                                                                                           |
| Chăn nuôi (2×2, 5 cấp)             | Đồng cỏ → Trại bò sữa (≥ 2) → Trang trại phô mai (≥ 4) → Trang viên ngựa đua (≥ 6) → Đại điền trang chăn nuôi đế quốc (≥ 8)                                                                                                     |
| Ngư nghiệp (1×1, 5 cấp)            | Bến cá → Lán cá hun khói (≥ 2) → Cầu tàu cá viễn dương (≥ 4) → Sàn giao dịch thủy sản (≥ 6) → Tổ hợp đồ hộp và dầu cá (≥ 8)                                                                                                     |
| Săn bắn (1×1, 4 cấp)               | Trại săn → Nhà kiểm lâm (≥ 2) → Trang viên chim ưng (≥ 4) → Hành cung săn bắn hoàng gia (≥ 7)                                                                                                                                   |

Ruộng lúa, rau và dâu vẫn lớn dần theo mùa vụ ngay trên mô hình chi tiết.

![Nhóm 5 trong thị trấn](docs/images/group5-town.jpg)

![Chuỗi Nông trại 7 cấp](docs/images/group5-farm.jpg)

![Chuỗi Vườn quả và rượu vang](docs/images/group5-orchard.jpg)

![Chuỗi Chăn nuôi](docs/images/group5-livestock.jpg)

| ![Chuỗi Ngư nghiệp](docs/images/group5-fishing.jpg)                     | ![Chuỗi Săn bắn](docs/images/group5-hunting.jpg)             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| ![Trang viên cối xay gió](docs/images/group5-windmill.jpg)              | ![Lâu đài rượu vang Chateau](docs/images/group5-chateau.jpg) |
| ![Nông trại thẳng đứng về đêm](docs/images/group5-hydroponic-night.jpg) | ![Tổ hợp đồ hộp và dầu cá](docs/images/group5-cannery.jpg)   |

### Nhóm 1: Khai khoáng và Đường ray

Mỏ đá, hố đất sét, mỏ sắt và đường ray được dựng lại theo phong cách sa bàn chi tiết: tầng đá cắt từng khối, hố sét có nước, cửa hầm chống gỗ, tháp giếng, ống khói gạch, băng tải, silo thép, xe goòng, xe tải, công nhân và đèn pha. Mỏ đá, hố sét và mỏ sắt chiếm 2×2 ô (đường ray vẫn 1×1). Chuỗi và ngưỡng đô thị do Antigravity thiết kế; mô hình dựng lại để khớp ảnh concept.

| Chuỗi                   | Cấp                                                                    |
| ----------------------- | ---------------------------------------------------------------------- |
| Mỏ đá (2×2, 3 cấp)      | Mỏ đá thủ công → Mỏ đá hơi nước (đô thị ≥ 2) → Mỏ đá công nghiệp (≥ 4) |
| Hố đất sét (2×2, 3 cấp) | Hố đất sét → Lò gạch thủ công (≥ 2) → Nhà máy gạch công nghiệp (≥ 4)   |
| Mỏ sắt (2×2, 3 cấp)     | Mỏ sắt thủ công → Mỏ sắt tháp tời (≥ 2) → Mỏ sắt sâu (≥ 4)             |
| Đường ray (1×1, 2 cấp)  | Đường ray gỗ → Đường ray sắt (≥ 2)                                     |

![Nhóm 1 trong thị trấn](docs/images/group1-town.jpg)

![Chuỗi Mỏ đá](docs/images/group1-quarry.jpg)

![Chuỗi Hố đất sét](docs/images/group1-claypit.jpg)

![Chuỗi Mỏ sắt](docs/images/group1-ironmine.jpg)

| ![Chuỗi Đường ray](docs/images/group1-rail.jpg) | ![Nhóm 1 về đêm](docs/images/group1-night.jpg) |
| ----------------------------------------------- | ---------------------------------------------- |

### Nhóm 2A: Công nghiệp nặng và Năng lượng

Nhà máy điện, xưởng đúc, nhà máy, lò luyện thép và mỏ than được dựng lại thành sa bàn chi tiết trên ô 2×2 (lò luyện thép 3×2): nhà máy điện với tuabin, tháp giải nhiệt và trụ điện; xưởng đúc với nồi rót kim loại nóng chảy; mái răng cưa; lò cao với bốn lò gió nóng; tháp tời, băng tải than, xe goòng, công nhân và đèn pha. Thêm 7 công trình cấp cao, mở theo mức đô thị.

| Chuỗi               | Cấp                                                                       |
| ------------------- | ------------------------------------------------------------------------- |
| Nhà máy điện (2×2)  | Nhà máy điện → Nhà máy hơi nước (đô thị ≥ 2) → Nhà máy điện tuabin (≥ 4)  |
| Xưởng đúc (2×2)     | Xưởng đúc → Xưởng đúc nặng (≥ 2)                                          |
| Lò luyện thép (3×2) | Lò luyện thép → Lò luyện thép Bessemer (≥ 2) → Tổ hợp thép liên hợp (≥ 5) |
| Mỏ than (2×2)       | Mỏ than đá → Mỏ than tháp tời (≥ 2) → Mỏ than hầm sâu (≥ 4)               |
| Nhà máy (2×2)       | Nhà máy mái răng cưa                                                      |

![Nhóm 2A trong thị trấn](docs/images/group2a-town.jpg)

![Chuỗi Nhà máy điện](docs/images/group2a-power.jpg)

![Xưởng đúc và Nhà máy](docs/images/group2a-foundry.jpg)

![Chuỗi Lò luyện thép](docs/images/group2a-steel.jpg)

![Chuỗi Mỏ than](docs/images/group2a-coal.jpg)

![Nhóm 2A về đêm](docs/images/group2a-night.jpg)

### Nhóm 2B: Lâm nghiệp, Đẽo đá, Đường sắt, Sân bay và Bến cảng

Trại đốn gỗ, hố sỏi, ga đường sắt, sân bay, bến phà, cảng cá và lều câu băng được dựng lại thành sa bàn chi tiết trên lô lớn hơn (2×2; ga 4×3; sân bay 4×4; bến phà 3×2; cảng cá 3×3). Thêm 5 công trình cấp cao mở theo mức đô thị: trại tiều phu cơ giới, dinh trưởng rừng (tháp canh lửa, vườn ươm kính), xưởng thợ đẽo đá, xưởng chế tác đá cơ khí (máy nghiền, cẩu giàn) và ga mái vòm kính kiểu Victoria.

| Chuỗi                   | Cấp                                                                       |
| ----------------------- | ------------------------------------------------------------------------- |
| Lâm nghiệp (2×2, 3 cấp) | Trại đốn gỗ → Trại tiều phu cơ giới (đô thị ≥ 2) → Dinh trưởng rừng (≥ 4) |
| Đẽo đá (2×2, 3 cấp)     | Hố sỏi → Xưởng thợ đẽo đá (≥ 2) → Xưởng chế tác đá cơ khí (≥ 4)           |
| Đường sắt (4×3, 2 cấp)  | Ga gỗ thôn dã → Ga đường sắt mái vòm kính (≥ 3)                           |
| Đứng riêng              | Sân bay nhỏ (4×4), Bến phà (3×2), Cảng đánh bắt (3×3), Lều câu băng (2×2) |

![Nhóm 2B trong thị trấn](docs/images/group2b-town.jpg)

![Chuỗi Lâm nghiệp](docs/images/group2b-forestry.jpg)

![Chuỗi Đẽo đá](docs/images/group2b-masonry.jpg)

![Ga đường sắt](docs/images/group2b-rail.jpg)

![Sân bay nhỏ](docs/images/group2b-airfield.jpg)

![Bến phà, cảng cá và lều câu băng](docs/images/group2b-maritime.jpg)

![Nhóm 2B về đêm](docs/images/group2b-night.jpg)

### Nhóm 2C: Trường học, Vườn, Nhà gỗ và Giao thương

Trường học, vườn hoa, nhà gỗ, lều yurt, trạm giao thương và ruộng muối được dựng lại thành sa bàn chi tiết trên lô lớn hơn (trường và vườn 3×3; nhà gỗ, yurt, trạm giao thương, ruộng muối 2×2). Thêm 2 công trình cấp cao: vườn bách thảo (mê cung cây xén, chòi sắt rèn) và cung điện kính Victoria (mái vòm kính có gân, cọ nhiệt đới, hồ sen, tượng).

| Chuỗi                   | Cấp                                                                               |
| ----------------------- | --------------------------------------------------------------------------------- |
| Trường học (3×3, 3 cấp) | Lớp học làng gỗ → Trường tiểu học gạch đỏ → Học viện đá vôi (đã có sẵn, dựng lại) |
| Vườn hoa (3×3, 3 cấp)   | Vườn hoa → Vườn bách thảo (đô thị ≥ 2) → Cung điện kính Victoria (≥ 4)            |
| Đứng riêng              | Nhà gỗ sưởi, Lều yurt, Trạm giao thương, Ruộng muối (2×2)                         |

![Nhóm 2C trong thị trấn](docs/images/group2c-town.jpg)

![Chuỗi Trường học](docs/images/group2c-school.jpg)

![Chuỗi Vườn](docs/images/group2c-garden.jpg)

![Nhà gỗ, yurt, trạm giao thương và ruộng muối](docs/images/group2c-rustic.jpg)

![Nhóm 2C về đêm](docs/images/group2c-night.jpg)

### Nhóm 3A: Công nghiệp nhẹ (luyện kim, xưởng, cưa, lò gạch, xay bột, bánh)

Sáu chuỗi công nghiệp nhẹ được dựng lại thành sa bàn chi tiết trên lô 2×2, mỗi cấp cao hơn và phức tạp hơn cấp trước.

| Chuỗi             | Các cấp                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Luyện kim (7 cấp) | Lò nấu → Lò thổi ống bễ → Lò phản xạ → Lò cao → Lò thổi Bessemer → Lò hồ quang → Tháp luyện kim |
| Xưởng thợ (6 cấp) | Xưởng → Xưởng phường hội → Xưởng guồng nước → Xưởng hơi nước → Xưởng chính xác → Đại công xưởng |
| Xưởng cưa (5 cấp) | Xưởng cưa → Cưa máng nước → Xưởng gỗ → Cưa hơi nước → Xưởng gỗ lớn                              |
| Lò gạch (5 cấp)   | Lò gạch → Lò hướng xuống → Xưởng lò → Lò hầm → Xưởng gốm                                        |
| Cối xay (5 cấp)   | Cối xay trụ → Cối xay áo choàng → Cối xay đá → Cối nhiều cánh → Tháp điện gió                   |
| Tiệm bánh (5 cấp) | Tiệm bánh → Bánh chợ → Bánh phường hội → Tiệm patisserie → Xưởng bánh hoàng gia                 |

![Chuỗi Luyện kim 1](docs/images/group3a-smelting-a.jpg)

![Chuỗi Luyện kim 2](docs/images/group3a-smelting-b.jpg)

![Chuỗi Luyện kim 3](docs/images/group3a-smelting-c.jpg)

![Chuỗi Xưởng thợ 1](docs/images/group3a-workshop-a.jpg)

![Chuỗi Xưởng thợ 2](docs/images/group3a-workshop-b.jpg)

![Chuỗi Xưởng cưa 1](docs/images/group3a-sawmill-a.jpg)

![Chuỗi Xưởng cưa 2](docs/images/group3a-sawmill-b.jpg)

![Chuỗi Lò gạch 1](docs/images/group3a-kiln-a.jpg)

![Chuỗi Lò gạch 2](docs/images/group3a-kiln-b.jpg)

![Chuỗi Cối xay 1](docs/images/group3a-windmill-a.jpg)

![Chuỗi Cối xay 2](docs/images/group3a-windmill-b.jpg)

![Chuỗi Tiệm bánh 1](docs/images/group3a-bakery-a.jpg)

![Chuỗi Tiệm bánh 2](docs/images/group3a-bakery-b.jpg)

### Nhóm 3C (phần 1): Chợ, Quán rượu, Nhà nguyện, Trạm xá

Bốn chuỗi dân sự giữa thị trấn được dựng lại thành sa bàn chi tiết trên lô 2×2 (quán rượu, nhà nguyện và trạm xá nới từ 1×1 vì chi tiết quá nhỏ; chợ vốn đã 2×2). Mỗi cấp cao hơn cấp trước.

| Chuỗi      | Các cấp                                         |
| ---------- | ----------------------------------------------- |
| Chợ        | Chợ lộ thiên → Chợ có mái → Đại chợ vòm kính    |
| Quán rượu  | Quán rượu → Nhà phường hội → Quán trọ lớn       |
| Nhà nguyện | Nhà nguyện làng → Nhà thờ giáo xứ → Thánh đường |
| Trạm xá    | Trạm xá → Y viện → Đại y viện                   |

![Chuỗi Chợ](docs/images/group3c-market.jpg)

![Chuỗi Quán rượu](docs/images/group3c-tavern.jpg)

![Chuỗi Nhà nguyện](docs/images/group3c-chapel.jpg)

![Chuỗi Trạm xá](docs/images/group3c-clinic.jpg)

### Nhóm 3C (phần 2): Nước, Hải đăng, Thư viện và công trình công cộng lẻ

Giếng nước, hải đăng, thư viện và ba công trình lẻ được dựng lại thành sa bàn chi tiết, kích thước ô giữ nguyên. Các công trình này vẽ theo tỉ lệ ô cố định, nên lô lớn chứa nhiều chi tiết hơn chứ không phóng to người và đồ vật; riêng thư viện (3×3), khu nghiên cứu (4×4) và lớp học cộng đồng (2×3) được vẽ lớn hơn một chút để công trình lấp đầy lô. Thư viện vòm đồng làm lại theo đúng concept art đã duyệt.

| Chuỗi            | Cấp                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Giếng nước (1×1) | Giếng có mái ngói → Bể nước vòm đá → Trạm bơm hơi nước → Tháp nước đinh tán → Tháp thủy áp và cầu dẫn nước |
| Hải đăng (1×1)   | Tháp sọc đỏ trắng → Tháp đá bát giác có nhà người gác → Đại hải đăng cẩm thạch                             |
| Thư viện (3×3)   | Thư viện gạch có vòm đọc sách → Thư viện vòm đồng (concept đã duyệt) → Đại Thư viện Quốc gia               |
| Công trình lẻ    | Lớp học cộng đồng (2×3), Vườn thuốc (1×1), Khu nghiên cứu có đài thiên văn và nhà kính (4×4)               |

![Chuỗi Giếng nước](docs/images/civic-water.jpg)

![Chuỗi Hải đăng](docs/images/civic-lighthouse.jpg)

![Chuỗi Thư viện](docs/images/civic-library.jpg)

![Lớp học cộng đồng, Vườn thuốc, Khu nghiên cứu](docs/images/civic-sites.jpg)

### Nhóm 4: Hạ tầng (toà thị chính, kho, cảng, giao thông công cộng, bãi vật liệu, kho nông sản)

Toà thị chính, nhà kho, cảng hàng hóa, trạm xe buýt, ga tàu điện ngầm, bãi vật liệu và kho nông sản được dựng lại thành sa bàn chi tiết, kích thước ô giữ nguyên và vẽ theo tỉ lệ ô cố định như nhóm công trình công cộng. Toà thị chính Tân cổ điển làm lại theo đúng concept art đã duyệt. Mỗi lô có người qua lại, xe cộ, cây xanh và đèn đường.

| Chuỗi                  | Cấp                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Toà thị chính (2×2)    | Toà gạch có tháp đồng hồ và quảng trường → Toà Tân cổ điển (concept đã duyệt) → Dinh Đô đốc  |
| Nhà kho (2×2)          | Kho gạch và khung gỗ có ròng rọc → Kho trung chuyển có tháp điều phối → Trung tâm tiếp vận   |
| Cảng hàng hóa (3×2)    | Kè đá, cần cẩu gỗ, kho hàng → Hai cần cẩu và nhà hải quan → Dinh hải quan cẩm thạch          |
| Trạm xe buýt (1×1)     | Nhà chờ kính thép và xe buýt → Nhà chờ xe điện gang có đồng hồ → Kiosk bát giác đồng và kính |
| Ga tàu điện ngầm (2×2) | Lối xuống ga và phòng vé kính → Mái vòm sắt kính → Đại ga Beaux-Arts có tháp đồng hồ         |
| Lẻ (2×2)               | Bãi vật liệu (gỗ, đá, gạch, cần trục), Kho nông sản trên cột đá                              |

![Chuỗi Toà thị chính](docs/images/infra-townhall.jpg)

![Chuỗi Nhà kho](docs/images/infra-warehouse.jpg)

![Chuỗi Cảng hàng hóa](docs/images/infra-port.jpg)

![Chuỗi Trạm xe buýt](docs/images/infra-transit.jpg)

![Chuỗi Ga tàu điện ngầm](docs/images/infra-metro.jpg)

![Bãi vật liệu và Kho nông sản](docs/images/infra-yards.jpg)

### Nhóm 5B: Thiên nhiên mở rộng (15 công trình mới)

Thêm 15 công trình thiên nhiên đủ thể loại: hồ nước, đồng cỏ, vườn chuyên đề, rừng và công trình theo địa hình (núi, thảo nguyên, xứ lạnh, ven nước), mỗi loại một kích thước và hiệu ứng riêng. Tất cả đều là sa bàn chi tiết vẽ theo tỉ lệ ô cố định.

| Công trình           | Ô   | Đặc điểm                                                                |
| -------------------- | --- | ----------------------------------------------------------------------- |
| Ao sen               | 2×2 | Hồ sen, cầu gỗ cong, chòi nghỉ, liễu rủ; tăng cây xanh, giải trí        |
| Vườn đá Thiền        | 1×1 | Sỏi cào vân, đá, đèn đá; tăng giải trí, tín ngưỡng                      |
| Rừng tre             | 1×1 | Khóm tre, lối đi; không cần đường                                       |
| Đồng hoa dại         | 2×2 | Hoa dại, bướm; tăng cây xanh, giảm tiếng ồn, không cần đường            |
| Mê cung cây xanh     | 3×3 | Ba vòng tường cây, đài phun nước ở giữa; giải trí cao                   |
| Vườn thác nước       | 2×2 | Vách đá, thác, hồ, suối và cầu; cần nguồn nước                          |
| Vườn bướm            | 1×1 | Luống hoa, nhà kính nuôi bướm; tăng giáo dục                            |
| Khu bảo tồn chim     | 2×2 | Chòi quan sát chim, hộp tổ, hồ; cần gần rừng                            |
| Bãi dã ngoại         | 2×2 | Khăn picnic, bàn ghế, diều; giải trí                                    |
| Đường mòn trong rừng | 2×1 | Lối mòn, khúc gỗ, biển chỉ đường; cần gần rừng, không cần đường         |
| Cầu gỗ ven hồ        | 2×1 | Cầu gỗ dọc mặt nước, bến thuyền, lau sậy; cần gần nước                  |
| Đồng cỏ núi cao      | 2×2 | Đá phủ tuyết, hoa núi, chòi đá, dê; đặt được trên núi                   |
| Vườn xương rồng      | 1×1 | Xương rồng, thùa, mái che; đặt được trên thảo nguyên                    |
| Công viên tùng tuyết | 2×2 | Tùng phủ tuyết, hồ băng có người trượt, người tuyết; đặt được ở xứ lạnh |
| Vườn rau cộng đồng   | 2×2 | Sáu luống rau, kho dụng cụ, ủ phân; sản xuất một ít lương thực          |

![Hồ, thác, cầu gỗ, khu bảo tồn chim](docs/images/nature-water.jpg)

![Đồng hoa dại, bãi dã ngoại, đồng cỏ núi cao, công viên tùng tuyết](docs/images/nature-meadows.jpg)

![Vườn đá, rừng tre, vườn bướm, vườn xương rồng, đường mòn, vườn rau](docs/images/nature-gardens.jpg)

![Mê cung cây xanh](docs/images/nature-maze.jpg)

### Bảng màu cho người mù màu

Bật trong ⚙ (hoặc `?palette=cvd`): xanh dương thay cho xanh lá, cam thay cho đỏ ở thông báo, ô đặt thử và số liệu tài nguyên. Mọi thông báo còn có ký hiệu đi kèm (✔ tốt, ▲ cảnh báo, ✖ xấu) nên không phụ thuộc vào màu.

![Thông báo có ký hiệu, tông màu xanh dương](docs/images/palette.jpg)

### Chơi trên điện thoại

Giao diện tự xếp lại cho màn hình nhỏ; chạm để xây, hai ngón để zoom/xoay. Bản đồ nhỏ ẩn sẵn, mở bằng nút 🗺.

<img src="docs/images/phone.jpg" alt="Giao diện trên điện thoại" width="280">

## Điều khiển

| Thao tác                              | Việc                                 |
| ------------------------------------- | ------------------------------------ |
| Kéo chuột trái / WASD / phím mũi tên  | Di chuyển (giữ Shift để nhanh)       |
| Kéo chuột phải                        | Xoay và nghiêng                      |
| Q / E                                 | Xoay 90°                             |
| R / F                                 | Nghiêng lên / xuống                  |
| Cuộn chuột                            | Zoom                                 |
| Cảm ứng: 1 ngón kéo, 2 ngón chụm/xoay | Di chuyển, zoom, xoay                |
| Space                                 | Tạm dừng / chạy tiếp                 |
| 1–9, 0                                | Bật/tắt bản đồ nhiệt một trường      |
| P                                     | Chế độ quy hoạch (bản nháp miễn phí) |
| X / Esc / Ctrl+Z / Ctrl+Y             | Phá / huỷ / hoàn tác / làm lại       |
| Bấm vào công trình                    | Xem trạng thái và "Vì sao?"          |
| M                                     | Bật/tắt bản đồ nhỏ                   |
| Ctrl+S                                | Lưu ván                              |

## Chạy trên máy (Windows / macOS / Linux)

Cần **Node.js 22** trở lên (https://nodejs.org).

```bash
npm install          # lần đầu
npm run dev          # mở http://localhost:5173
```

Tham số URL:

- `?seed=hanoi` đổi thế giới (cùng seed luôn ra cùng thế giới)
- `?speed=0|1|2|4` tốc độ lúc mở game, `?sandbox=1` mở khoá mọi công trình
- `&x=1000000&z=-500` bắt đầu tại ô bất kỳ
- `&r=4` bán kính hiển thị (chunk), giảm nếu máy yếu

## Lệnh thường dùng

| Lệnh                                                                      | Việc                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                                             | Server phát triển, tự reload                                   |
| `npm run check`                                                           | Lint + typecheck + kiểm dữ liệu + unit test + build (giống CI) |
| `npm test`                                                                | Unit test (Vitest)                                             |
| `npx playwright install chromium` rồi `npm run build && npm run test:e2e` | Smoke test trên trình duyệt                                    |
| `npm run build` rồi `npm run preview`                                     | Thử bản production tại http://localhost:4173                   |

## Deploy lên GitHub Pages

1. Tạo repo trên GitHub (ví dụ `myriad-towns`) và push nhánh `main`.
2. Vào **Settings → Pages → Build and deployment → Source** chọn **GitHub Actions**.
3. Mỗi lần push lên `main`, workflow `deploy.yml` build và đăng tại `https://<tài-khoản>.github.io/myriad-towns/`.

## Làm việc với nhiều agent

Quy ước chung cho Claude Code và Antigravity nằm trong [AGENTS.md](AGENTS.md). Việc giao cho agent viết thành
task spec trong [docs/tasks/](docs/tasks/), bắt đầu từ [\_TEMPLATE.md](docs/tasks/_TEMPLATE.md).

## Lộ trình

| Mốc | Nội dung                                                                       | Trạng thái |
| --- | ------------------------------------------------------------------------------ | ---------- |
| M0  | Khung dự án, công cụ, CI                                                       | ✔          |
| M1  | Thế giới vô hạn theo chunk, camera                                             | ✔          |
| M2  | Đặt công trình, luật bán kính, hoàn tác                                        | ✔          |
| M3  | Kinh tế, mô phỏng, nâng cấp/xuống cấp, bản đồ nhiệt, quy hoạch                 | ✔          |
| M4  | Chế độ chơi, chương, gói công trình, biome, di tích, nhiều thị trấn, hướng dẫn | ✔          |
| M5  | Lưu/tải, tự lưu, xuất/nhập file, cài đặt                                       | ✔          |
| M6a | Ngày đêm, âm thanh tự tổng hợp, hiệu ứng xây, cài đặt âm lượng                 | ✔          |
| M6b | Đường tự nối, đèn đêm, nhà có vườn, bảng màu cho người mù màu                  | ✔          |
| M6c | Icon tài nguyên, ảnh công trình trong menu, panel chi tiết bên phải            | ✔          |
| M6d | Cầu, đường tự nâng cấp, công nghiệp mới, dễ chơi hơn ở biome thiếu đá          | ✔          |
| M6e | Người đi lại và phương tiện theo thời đại                                      | ✔          |
| M6f | Tài nguyên xếp dọc, minimap và bản đồ nhiệt có nút bật/tắt, địa hình phẳng     | ✔          |
| M7  | Phát hành công khai, cài như ứng dụng (PWA), chơi offline                      | Tiếp theo  |

Chi tiết kỹ thuật: [docs/architecture.md](docs/architecture.md) và các ADR trong [docs/adr](docs/adr).

## Giấy phép

Mã nguồn: chưa chọn (xem `LICENSE` khi có). Asset bên thứ ba ghi trong `CREDITS.md`.
