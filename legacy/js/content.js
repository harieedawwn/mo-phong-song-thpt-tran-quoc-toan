export const LESSON = [
  {
    id: 'nature',
    title: 'Bản chất của sóng âm',
    icon: '🔊',
    paragraphs: [
      'Nguồn âm là vật dao động. Khi ta nói, dây thanh âm dao động; không khí trong cổ họng và khoang miệng dao động theo và truyền ra ngoài qua miệng.',
      'Sóng âm truyền trong chất khí là sóng dọc.',
      'Các phần tử không khí dao động quanh vị trí cân bằng.',
      'Chúng dao động song song với phương truyền sóng.',
      'Quá trình này chỉ truyền năng lượng và trạng thái dao động.',
      'Các phần tử vật chất không bị truyền đi theo sóng.',
      'Sự dao động này tạo ra các vùng nén và vùng giãn luân phiên nhau.',
      'Vùng nén có áp suất cao hơn bình thường.',
      'Vùng giãn có áp suất thấp hơn bình thường.'
    ],
    advanced: [
      'Vùng nén là nơi các phần tử không khí hội tụ lại gần nhau. Vùng giãn là nơi chúng thưa ra.',
      'Áp suất đạt cực đại lệch một phần tư chu kì so với li độ cực đại. Áp suất dẫn trước li độ một phần tư chu kì.',
      'Ở 20 °C, tốc độ truyền âm trong không khí là 343 m/s.'
    ]
  },
  {
    id: 'quantities',
    title: 'Các đại lượng đặc trưng',
    icon: '📐',
    items: [
      { term: 'Tần số f', text: 'Là số dao động thực hiện trong 1 giây. Đơn vị là Hz. Tần số quyết định độ cao của âm thanh, tức là âm trầm hay bổng. Tai người bình thường nghe được âm thanh trong dải tần từ 20 Hz đến 20000 Hz.' },
      { term: 'Chu kì T', text: 'Là khoảng thời gian để thực hiện một dao động toàn phần.', formula: 'T = 1/f' },
      { term: 'Bước sóng λ', text: 'Là quãng đường sóng truyền đi được trong một chu kì. Về mặt không gian, đây cũng là khoảng cách giữa hai vùng nén liên tiếp. Nó cũng là khoảng cách giữa hai vùng giãn liên tiếp.' },
      { term: 'Tốc độ truyền âm v', text: 'Phụ thuộc vào bản chất của môi trường truyền. Sóng âm truyền nhanh nhất trong chất rắn, rồi đến chất lỏng. Nó chậm nhất trong chất khí. Trong cùng một môi trường ở nhiệt độ ổn định, tốc độ này là một hằng số không đổi.' }
    ],
    formulas: ['T = 1/f', 'λ = v/f', 'v = λ · f'],
    live: true,
    advanced: [
      'Tốc độ âm: 343 m/s trong không khí ở 20 °C, khoảng 1482 m/s trong nước, khoảng 5960 m/s trong thép.',
      'Vì v không đổi trong cùng môi trường, tần số tăng thì bước sóng giảm.',
      'Tai người nhạy nhất ở khoảng 2–5 kHz.'
    ]
  },
  {
    id: 'amplitude',
    title: 'Biên độ và độ to (decibel)',
    icon: '📈',
    paragraphs: [
      'Biên độ dao động càng lớn thì li độ của các hạt càng lớn.',
      'Độ biến thiên áp suất cũng càng cao.',
      'Khi đó âm phát ra càng to.',
      'Mức cường độ âm được đo bằng đơn vị decibel, kí hiệu là dB.'
    ],
    items: [
      { term: '~30 dB', text: 'Tiếng thì thầm.' },
      { term: '~60 dB', text: 'Cuộc trò chuyện bình thường.' },
      { term: '~85 dB', text: 'Giao thông đông đúc.' },
      { term: '~120 dB', text: 'Ngưỡng đau của tai.' }
    ],
    advanced: [
      'Tần số quyết định âm cao hay thấp. Biên độ quyết định âm to hay nhỏ.',
      'Trong mô phỏng, thanh mức âm (20–100 dB) thay đổi biên độ của sóng.'
    ]
  },
  {
    id: 'timbre',
    title: 'Âm sắc và họa âm',
    icon: '🎼',
    paragraphs: [
      'Giọng nói của con người trong thực tế không phải là âm đơn hình sin.',
      'Nó là sự tổng hợp của âm cơ bản và các họa âm.',
      'Sự tổng hợp này tạo nên âm sắc riêng biệt.',
      'Đồ thị biến thiên của nó vì vậy rất phức tạp.'
    ],
    advanced: [
      'Mô phỏng có ba âm sắc: âm đơn (sin), giọng nói và âm giàu họa âm (8 họa âm, biên độ giảm theo 1/n).',
      'Hãy thử chuyển âm sắc và xem tab Phổ tần số trong Máy hiện sóng.'
    ]
  },
  {
    id: 'ear',
    title: 'Tai nghe âm thanh như thế nào',
    icon: '👂',
    paragraphs: ['Âm thanh đi qua tai theo từng bước sau.'],
    steps: [
      'Sóng âm truyền vào ống tai ngoài. Ống tai dài khoảng 2,5 cm và cộng hưởng ở khoảng 3 kHz.',
      'Áp suất biến thiên tuần hoàn tác dụng trực tiếp lên màng nhĩ. Màng nhĩ rộng khoảng 9 mm.',
      'Màng nhĩ thực hiện dao động cưỡng bức. Tần số của nó bằng đúng tần số của sóng âm tới.',
      'Dao động truyền qua chuỗi xương con ở tai giữa: xương búa, xương đe và xương bàn đạp.',
      'Chuỗi xương này hoạt động như một hệ thống đòn bẩy. Cùng với sự chênh lệch diện tích màng nhĩ, nó khuếch đại áp suất âm thanh lên nhiều lần, khoảng 20 lần, trước khi đưa vào ốc tai.',
      'Ốc tai chứa dịch. Màng nền trong ốc tai đáp ứng với âm cao ở gần đáy, nơi có cửa sổ bầu dục. Nó đáp ứng với âm thấp ở gần đỉnh.',
      'Tế bào lông biến chuyển động thành tín hiệu điện (tín hiệu thần kinh).',
      'Dây thần kinh tiền đình ốc tai (dây thần kinh số VIII) đưa tín hiệu lên vỏ não thính giác.'
    ],
    advanced: [
      'Hệ số khuếch đại khoảng 20 lần đến từ hai yếu tố. Tỉ số diện tích màng nhĩ so với đế xương bàn đạp là khoảng 17:1. Tỉ số đòn bẩy là khoảng 1,3:1.',
      'Vòi nhĩ cân bằng áp suất hai bên màng nhĩ.',
      'Khi cửa sổ bầu dục bị ấn vào, màng cửa sổ tròn phồng ra.',
      'Ốc tai có khoảng 2,75 vòng xoắn.',
      'Ống bán khuyên và tiền đình phục vụ thăng bằng, không phục vụ nghe.'
    ]
  },
  {
    id: 'notes',
    title: 'Lưu ý khi xem mô phỏng',
    icon: '⚠️',
    paragraphs: ['Mô phỏng này đơn giản hóa một vài điều để dễ nhìn. Hãy nhớ những điểm sau.'],
    bullets: [
      'Thời gian bị làm chậm. Dao động thật nhanh hơn rất nhiều lần so với những gì bạn thấy. Hệ số làm chậm chỉnh được trong tab Mô phỏng.',
      'Chuyển động của phần tử không khí và của màng nhĩ được phóng đại. Thực tế, màng nhĩ chỉ dao động cỡ nanomet.',
      'Tai được vẽ phóng to nhiều lần để bạn nhìn rõ.',
      'Khi bước sóng thật nằm ngoài khoảng có thể vẽ (từ khoảng 0,25 m đến 8 m), sóng được vẽ rút ngắn hoặc kéo dài. Nhãn sẽ ghi rõ điều đó. Con số bước sóng hiển thị luôn là giá trị thật.',
      'Đầu người trong mô phỏng là một bản quét 3D.'
    ],
    advanced: [
      'Biên độ tại tai được hiển thị đủ lớn để dễ nhìn. Sự suy giảm theo khoảng cách không được áp vào hoạt ảnh của tai.'
    ]
  }
];

export const QUIZ = [
  {
    q: 'Khi sóng âm truyền trong không khí, điều gì được truyền đi xa?',
    options: ['Các phần tử không khí', 'Năng lượng và trạng thái dao động', 'Chỉ các vùng nén', 'Gió'],
    answer: 1,
    explain: 'Các hạt chỉ dao động quanh vị trí cân bằng, còn năng lượng và trạng thái dao động thì lan đi.'
  },
  {
    q: 'Một âm có tần số 500 Hz. Chu kì của nó là bao nhiêu?',
    options: ['0,5 s', '0,02 s', '0,002 s', '500 s'],
    answer: 2,
    explain: 'T = 1/f = 1/500 = 0,002 s, tức 2 ms.'
  },
  {
    q: 'Sóng âm có v = 343 m/s và f = 686 Hz. Bước sóng bằng bao nhiêu?',
    options: ['0,5 m', '2 m', '235 298 m', '0,05 m'],
    answer: 0,
    explain: 'λ = v/f = 343/686 = 0,5 m.'
  },
  {
    q: 'Âm truyền nhanh nhất trong môi trường nào?',
    options: ['Không khí', 'Nước', 'Thép', 'Chân không'],
    answer: 2,
    explain: 'Sóng âm truyền nhanh nhất trong chất rắn (thép khoảng 5960 m/s), chậm nhất trong chất khí.'
  },
  {
    q: 'Biên độ dao động tăng lên thì âm nghe thế nào?',
    options: ['Cao hơn', 'To hơn', 'Trầm hơn', 'Không đổi'],
    answer: 1,
    explain: 'Biên độ lớn hơn thì âm to hơn. Độ to được đo bằng mức cường độ âm, đơn vị dB.'
  },
  {
    q: 'Vì sao giọng nói của mỗi người có âm sắc riêng?',
    options: ['Vì nó là một âm đơn hình sin', 'Vì nó có tần số bằng 0', 'Vì nó là tổng hợp của âm cơ bản và các họa âm', 'Vì nó chỉ có vùng giãn'],
    answer: 2,
    explain: 'Giọng nói là tổng hợp của âm cơ bản và các họa âm, nên đồ thị của nó phức tạp.'
  },
  {
    q: 'Chuỗi xương con ở tai giữa có tác dụng gì?',
    options: ['Làm giảm áp suất âm', 'Khuếch đại áp suất âm khoảng 20 lần', 'Giữ thăng bằng cho cơ thể', 'Biến âm thành ánh sáng'],
    answer: 1,
    explain: 'Đòn bẩy xương con và sự chênh lệch diện tích màng nhĩ khuếch đại áp suất âm khoảng 20 lần.'
  },
  {
    q: 'Màng nền trong ốc tai đáp ứng với âm cao ở đâu?',
    options: ['Gần đáy, chỗ cửa sổ bầu dục', 'Gần đỉnh ốc tai', 'Ở màng nhĩ', 'Ở vành tai'],
    answer: 0,
    explain: 'Âm cao kích thích gần đáy, âm thấp kích thích gần đỉnh. Nhờ vậy ốc tai phân tích được tần số.'
  }
];

export const PARTS_INFO = {
  pinna: {
    vi: 'Vành tai', en: 'Auricle',
    simple: 'Vành tai hứng sóng âm từ ngoài vào. Nó dẫn sóng vào ống tai.',
    detail: 'Vành tai là phần tai nhìn thấy được bên ngoài đầu. Nó thuộc tai ngoài. Nó nằm phía ngoài ống tai. Sóng âm từ không khí đi vào ống tai qua đây.',
    fact: 'Ống tai nối vành tai với màng nhĩ chỉ dài khoảng 2,5 cm.'
  },
  canal: {
    vi: 'Ống tai ngoài', en: 'External auditory canal',
    simple: 'Ống tai ngoài là đường dẫn sóng âm đến màng nhĩ.',
    detail: 'Ống tai dài khoảng 2,5 cm. Nó nối vành tai với màng nhĩ. Sóng âm đi dọc ống và làm áp suất biến thiên tuần hoàn trước màng nhĩ. Ống tai cộng hưởng ở khoảng 3 kHz.',
    fact: 'Tần số cộng hưởng khoảng 3 kHz của ống tai nằm trong vùng 2–5 kHz mà tai người nghe nhạy nhất.'
  },
  drum: {
    vi: 'Màng nhĩ', en: 'Tympanic membrane',
    simple: 'Màng nhĩ là màng mỏng ngăn tai ngoài và tai giữa. Âm làm nó rung.',
    detail: 'Màng nhĩ rộng khoảng 9 mm. Áp suất biến thiên của sóng âm tác dụng trực tiếp lên nó. Nó thực hiện dao động cưỡng bức. Tần số dao động bằng đúng tần số sóng âm tới. Nó truyền dao động sang xương búa.',
    fact: 'Màng nhĩ thật chỉ dao động cỡ nanomet. Mô phỏng phóng đại chuyển động này rất nhiều để bạn nhìn thấy.'
  },
  malleus: {
    vi: 'Xương búa', en: 'Malleus',
    simple: 'Xương búa dính vào màng nhĩ. Nó nhận rung động đầu tiên.',
    detail: 'Xương búa là xương đầu tiên của chuỗi xương con. Cán búa gắn vào màng nhĩ. Nó truyền dao động sang xương đe. Cả chuỗi xương hoạt động như một hệ thống đòn bẩy.',
    fact: 'Cánh tay đòn phía màng nhĩ dài hơn phía xương bàn đạp khoảng 1,3 lần.'
  },
  incus: {
    vi: 'Xương đe', en: 'Incus',
    simple: 'Xương đe nằm giữa xương búa và xương bàn đạp. Nó chuyển rung động đi tiếp.',
    detail: 'Xương đe là xương thứ hai của chuỗi. Nó nối xương búa với xương bàn đạp. Nó xoay cùng xương búa quanh một trục. Nhờ đó dao động được truyền đi tiếp mà không bị mất.',
    fact: 'Búa, đe và bàn đạp cùng nhau khuếch đại áp suất âm khoảng 20 lần.'
  },
  stapes: {
    vi: 'Xương bàn đạp', en: 'Stapes',
    simple: 'Xương bàn đạp đẩy vào cửa sổ bầu dục. Nó đưa âm vào ốc tai.',
    detail: 'Xương bàn đạp là xương cuối của chuỗi xương con. Đế của nó áp vào cửa sổ bầu dục. Đế này nhỏ hơn màng nhĩ rất nhiều. Vì vậy áp suất được tập trung lại. Dao động của nó tạo sóng trong dịch ốc tai.',
    fact: 'Tỉ số diện tích màng nhĩ so với đế xương bàn đạp là khoảng 17:1.'
  },
  ovalWindow: {
    vi: 'Cửa sổ bầu dục', en: 'Oval window',
    simple: 'Cửa sổ bầu dục là cửa vào ốc tai. Xương bàn đạp đẩy vào đó.',
    detail: 'Cửa sổ bầu dục là một màng nhỏ ở ranh giới tai giữa và ốc tai. Đế xương bàn đạp áp vào nó. Khi xương bàn đạp đẩy vào, dịch trong ốc tai bị nén. Từ đó sóng đi vào ốc tai.',
    fact: 'Khi cửa sổ bầu dục bị ấn vào, màng cửa sổ tròn phồng ra.'
  },
  roundWindow: {
    vi: 'Cửa sổ tròn', en: 'Round window',
    simple: 'Cửa sổ tròn là màng nhỏ ở cuối ốc tai. Nó phồng ra khi cửa sổ bầu dục bị ấn vào.',
    detail: 'Cửa sổ tròn nằm gần đáy ốc tai. Nó nằm gần cửa sổ bầu dục. Ốc tai chứa dịch. Khi cửa sổ bầu dục bị ấn vào, màng cửa sổ tròn phồng ra. Khi cửa sổ bầu dục lùi lại, nó lõm vào.',
    fact: 'Hai cửa sổ luôn chuyển động ngược nhau: một cái vào thì cái kia ra.'
  },
  cavity: {
    vi: 'Hòm nhĩ (tai giữa)', en: 'Tympanic cavity',
    simple: 'Hòm nhĩ là khoang nhỏ chứa không khí ở tai giữa. Ba xương con nằm trong đó.',
    detail: 'Hòm nhĩ nằm sau màng nhĩ. Nó chứa chuỗi xương búa, đe và bàn đạp. Nó thông với vòm họng qua vòi nhĩ. Nhờ vòi nhĩ, áp suất hai bên màng nhĩ được cân bằng.',
    fact: 'Toàn bộ chuỗi xương con nằm gọn trong khoang này.'
  },
  eustachian: {
    vi: 'Vòi nhĩ', en: 'Eustachian tube',
    simple: 'Vòi nhĩ là ống nối tai giữa với họng. Nó cân bằng áp suất.',
    detail: 'Vòi nhĩ đi từ đáy hòm nhĩ xuống phía trong và phía dưới. Nó giúp áp suất không khí ở tai giữa bằng áp suất bên ngoài. Nhờ vậy màng nhĩ dao động tự do được.',
    fact: 'Vòi nhĩ cân bằng áp suất hai bên màng nhĩ.'
  },
  cochlea: {
    vi: 'Ốc tai', en: 'Cochlea',
    simple: 'Ốc tai là ống xoắn chứa dịch. Nó biến rung động thành tín hiệu thần kinh.',
    detail: 'Ốc tai xoắn khoảng 2,75 vòng và chứa dịch. Sóng đi vào từ cửa sổ bầu dục. Bên trong có màng nền và các tế bào lông. Mỗi tần số làm rung màng nền ở một vị trí riêng. Vì vậy ốc tai phân tích được tần số của âm.',
    fact: 'Ốc tai chỉ có khoảng 2,75 vòng xoắn mà phân tích được cả dải âm từ 20 Hz đến 20000 Hz.'
  },
  basilar: {
    vi: 'Màng nền', en: 'Basilar membrane',
    simple: 'Màng nền là màng trong ốc tai. Mỗi tần số làm rung một chỗ khác nhau.',
    detail: 'Màng nền chạy dọc theo ốc tai. Sóng đi dọc màng nền và đạt cực đại ở một vị trí. Âm cao làm rung gần đáy, chỗ cửa sổ bầu dục. Âm thấp làm rung gần đỉnh. Vị trí cực đại cho não biết tần số của âm.',
    fact: 'Âm 20 kHz làm rung màng nền ngay gần đáy, còn âm 20 Hz làm rung gần tận đỉnh.'
  },
  hairCells: {
    vi: 'Tế bào lông', en: 'Hair cells',
    simple: 'Tế bào lông biến chuyển động thành tín hiệu điện.',
    detail: 'Tế bào lông nằm trên màng nền. Khi màng nền rung, các tế bào lông ở gần chỗ cực đại bị kích thích mạnh nhất. Chúng biến chuyển động cơ học thành tín hiệu điện. Tín hiệu này được truyền sang dây thần kinh.',
    fact: 'Tế bào lông là nơi âm thanh được đổi từ dạng chuyển động sang dạng điện.'
  },
  vestibule: {
    vi: 'Tiền đình', en: 'Vestibule',
    simple: 'Tiền đình giúp giữ thăng bằng. Nó không dùng để nghe.',
    detail: 'Tiền đình nằm giữa ốc tai và các ống bán khuyên. Nó thuộc tai trong. Nó cùng các ống bán khuyên giúp cơ thể giữ thăng bằng. Nó không tham gia vào việc nghe.',
    fact: 'Tiền đình ở rất gần ốc tai nhưng phục vụ thăng bằng, không phục vụ nghe.'
  },
  canals: {
    vi: 'Ống bán khuyên', en: 'Semicircular canals',
    simple: 'Ba ống bán khuyên giúp cơ thể giữ thăng bằng. Chúng không dùng để nghe.',
    detail: 'Ống bán khuyên nằm phía trên tiền đình. Chúng thuộc tai trong. Chúng giúp cơ thể cảm nhận việc quay đầu. Chúng cùng tiền đình phục vụ thăng bằng.',
    fact: 'Dù nằm trong tai, các ống bán khuyên không giúp bạn nghe.'
  },
  nerve: {
    vi: 'Dây thần kinh số VIII', en: 'Vestibulocochlear nerve',
    simple: 'Dây thần kinh số VIII đưa tín hiệu từ tai lên não.',
    detail: 'Dây thần kinh tiền đình ốc tai (dây thần kinh sọ số VIII) rời ốc tai và tiền đình. Nó mang các tín hiệu điện từ tế bào lông. Tín hiệu đi lên vỏ não thính giác. Ở đó não nhận ra âm thanh. Âm càng to thì xung thần kinh càng dồn dập.',
    fact: 'Âm thanh chỉ thật sự được "nghe" khi tín hiệu đến vỏ não thính giác.'
  },
  bone: {
    vi: 'Xương thái dương', en: 'Temporal bone',
    simple: 'Xương thái dương là phần xương của sọ bao quanh tai giữa và tai trong.',
    detail: 'Xương thái dương nằm ở hai bên đầu. Nó bao quanh tai giữa và tai trong. Nó bảo vệ các bộ phận nhỏ bé bên trong.',
    fact: 'Tai giữa và tai trong nằm sâu trong xương thái dương.'
  }
};

export const TOUR = [
  {
    id: 'speaker', title: 'Loa tạo ra sóng âm',
    body: 'Màng loa dao động, lần lượt nén rồi làm giãn lớp không khí sát nó, tạo ra sóng âm truyền đi trong không khí.',
    detail: 'Lớp phần tử không khí sát màng loa dao động làm lớp kế tiếp dao động theo, cứ thế dao động được truyền đến tai người nghe. Có thể chuyển nguồn âm sang Miệng người: khi nói, dây thanh âm dao động và không khí ở miệng cũng bị nén, giãn như vậy.',
    view: 'room', preset: 'speaker', play: true, set: { emitter: 'speaker' }
  },
  {
    id: 'longitudinal', title: 'Sóng âm là sóng dọc',
    body: 'Các chấm đánh dấu là những phần tử không khí. Chúng chỉ dao động quanh vị trí cân bằng, theo phương trùng với phương truyền sóng (sóng dọc). Chỉ năng lượng được truyền đi.',
    detail: 'Mỗi hạt dao động quanh vị trí cân bằng của nó. Đó là đặc điểm của sóng dọc. Các hạt không bị cuốn đi như gió.',
    view: 'room', preset: 'path', play: true, set: { layers: { markers: true } }
  },
  {
    id: 'compression', title: 'Vùng nén, vùng giãn và bước sóng',
    body: 'Màu cam là vùng nén, áp suất cao. Màu xanh là vùng giãn, áp suất thấp. Khoảng cách giữa hai vùng nén liên tiếp là bước sóng.',
    detail: 'Áp suất cực đại lệch một phần tư chu kì so với li độ cực đại. Nơi các hạt hội tụ là vùng nén. Thước đo trong mô phỏng cho thấy bước sóng λ.',
    view: 'room', preset: 'path', play: true, set: { layers: { ruler: true, slice: true } }
  },
  {
    id: 'frequency', title: 'Tần số, chu kì và tốc độ',
    body: 'Hãy kéo thanh tần số và quan sát bước sóng λ thay đổi. Tần số tăng thì λ ngắn lại. Tốc độ v trong không khí không đổi.',
    detail: 'λ = v/f và T = 1/f. Trong không khí ở 20 °C, v = 343 m/s. Ví dụ ở 440 Hz, λ khoảng 0,78 m. Khi λ thật nằm ngoài khoảng vẽ được, sóng được vẽ rút ngắn và có nhãn ghi rõ.',
    view: 'room', preset: 'path', play: true
  },
  {
    id: 'arrive', title: 'Sóng đến tai người',
    body: 'Sóng đi qua không khí và đến tai phải của người nghe. Tai này quay về phía nguồn âm. Áp suất tại tai dao động theo sóng.',
    detail: 'Đầu trong mô phỏng là một bản quét 3D. Tại tai, áp suất biến thiên tuần hoàn. Đây chính là thứ màng nhĩ cảm nhận.',
    view: 'room', preset: 'head', play: true, headMode: 'full'
  },
  {
    id: 'canal-drum', title: 'Vào ống tai và màng nhĩ',
    body: 'Sóng đi vào ống tai ngoài dài khoảng 2,5 cm. Nó làm màng nhĩ rung cùng tần số. Chuyển động màng nhĩ ở đây được phóng đại.',
    detail: 'Màng nhĩ rộng khoảng 9 mm. Nó dao động cưỡng bức với tần số bằng tần số sóng tới. Thực tế chuyển động này chỉ cỡ nanomet. Ống tai cộng hưởng ở khoảng 3 kHz.',
    view: 'ear', preset: 'canal', then: { preset: 'drum', delay: 2.2 }, focus: 'drum', play: true
  },
  {
    id: 'ossicles', title: 'Chuỗi xương con khuếch đại âm',
    body: 'Xương búa, xương đe và xương bàn đạp truyền rung động đi tiếp. Chúng hoạt động như một đòn bẩy. Áp suất âm được khuếch đại khoảng 20 lần.',
    detail: 'Hệ số khoảng 20 đến từ tỉ số diện tích màng nhĩ so với đế xương bàn đạp (khoảng 17:1) nhân với tỉ số đòn bẩy (khoảng 1,3:1). Đế xương bàn đạp đẩy vào cửa sổ bầu dục. Cửa sổ tròn phồng ra khi cửa sổ bầu dục bị ấn vào.',
    view: 'ear', preset: 'ossicles', focus: 'malleus', play: true
  },
  {
    id: 'cochlea', title: 'Ốc tai phân tích tần số',
    body: 'Ốc tai chứa dịch và có khoảng 2,75 vòng xoắn. Âm cao làm màng nền rung gần đáy. Âm thấp làm rung gần đỉnh. Hãy thử một tần số thấp rồi một tần số cao.',
    detail: 'Màng nền có sóng chạy dọc, và biên độ đạt cực đại ở một vị trí tùy tần số. Tế bào lông ở gần chỗ cực đại biến chuyển động thành tín hiệu điện. Vị trí đó giúp não nhận ra độ cao của âm.',
    view: 'ear', preset: 'cochlea', focus: 'cochlea', play: true
  },
  {
    id: 'nerve', title: 'Tín hiệu đi về não',
    body: 'Tín hiệu điện đi theo dây thần kinh số VIII. Nó đến vỏ não thính giác. Ở đó ta nhận ra âm thanh.',
    detail: 'Dây thần kinh tiền đình ốc tai (dây thần kinh sọ số VIII) mang tín hiệu từ ốc tai. Âm càng to thì xung thần kinh càng dồn dập. Ống bán khuyên và tiền đình trong cùng bó dây phục vụ thăng bằng, không phục vụ nghe.',
    view: 'ear', preset: 'nerve', focus: 'nerve', play: true
  }
];

export const CREDITS = [
  'Bản quét đầu người của Lee Perry-Smith (CC BY 3.0), lấy từ các ví dụ của three.js.',
  'Three.js (giấy phép MIT).'
];
