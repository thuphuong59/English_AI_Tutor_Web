import sys
import time
import requests 
from datetime import datetime
from urllib.parse import quote_plus

# === CẤU HÌNH ===
# !!! QUAN TRỌNG: Hãy thay số bên dưới bằng ID của bộ từ 'Cambridge B1/B2' bạn vừa tạo
DECK_ID_TO_SEED = 2 
# === KẾT THÚC CẤU HÌNH ===


# 2. DANH SÁCH 100 TỪ VỰNG CAMBRIDGE (B1/B2 Level)
WORD_DATA = [
    # Topic: Education & Learning (Giáo dục)
    {'word': 'curriculum', 'type': 'noun', 'definition': 'chương trình giảng dạy', 'context': 'Math is a key part of the school curriculum.'},
    {'word': 'scholarship', 'type': 'noun', 'definition': 'học bổng', 'context': 'She won a scholarship to study at Oxford.'},
    {'word': 'qualifiction', 'type': 'noun', 'definition': 'bằng cấp, trình độ chuyên môn', 'context': 'You need a teaching qualification to work here.'},
    {'word': 'tuition', 'type': 'noun', 'definition': 'học phí (hoặc sự giảng dạy)', 'context': 'University tuition fees have increased this year.'},
    {'word': 'attendance', 'type': 'noun', 'definition': 'sự tham dự, điểm danh', 'context': 'Attendance at lectures is compulsory.'},
    {'word': 'revise', 'type': 'verb', 'definition': 'ôn tập', 'context': 'I need to revise for my history exam.'},
    {'word': 'graduate', 'type': 'verb', 'definition': 'tốt nghiệp', 'context': 'He will graduate from college next month.'},
    {'word': 'assignment', 'type': 'noun', 'definition': 'bài tập, nhiệm vụ', 'context': 'The teacher gave us a difficult assignment.'},
    {'word': 'discipline', 'type': 'noun', 'definition': 'kỷ luật', 'context': 'The school maintains strict discipline.'},
    {'word': 'literacy', 'type': 'noun', 'definition': 'trình độ học vấn (biết đọc viết)', 'context': 'Adult literacy rates have improved.'},

    # Topic: Environment & Nature (Môi trường)
    {'word': 'pollution', 'type': 'noun', 'definition': 'sự ô nhiễm', 'context': 'Air pollution is a major problem in big cities.'},
    {'word': 'conservation', 'type': 'noun', 'definition': 'sự bảo tồn', 'context': 'Wildlife conservation is very important.'},
    {'word': 'environment', 'type': 'noun', 'definition': 'môi trường', 'context': 'We must protect the environment for future generations.'},
    {'word': 'climate', 'type': 'noun', 'definition': 'khí hậu', 'context': 'The climate is getting warmer every year.'},
    {'word': 'sustainable', 'type': 'adjective', 'definition': 'bền vững', 'context': 'We need to find sustainable energy sources.'},
    {'word': 'extinct', 'type': 'adjective', 'definition': 'tuyệt chủng', 'context': 'Dinosaurs became extinct millions of years ago.'},
    {'word': 'species', 'type': 'noun', 'definition': 'loài', 'context': 'Many species of birds live in this forest.'},
    {'word': 'disaster', 'type': 'noun', 'definition': 'thảm họa', 'context': 'The earthquake was a terrible disaster.'},
    {'word': 'renewable', 'type': 'adjective', 'definition': 'có thể tái tạo', 'context': 'Solar power is a form of renewable energy.'},
    {'word': 'habitat', 'type': 'noun', 'definition': 'môi trường sống', 'context': 'The panda\'s natural habitat is the bamboo forest.'},

    # Topic: Travel & Transport (Du lịch)
    {'word': 'accommodation', 'type': 'noun', 'definition': 'chỗ ở', 'context': 'Have you booked accommodation for your trip?'},
    {'word': 'itinerary', 'type': 'noun', 'definition': 'lịch trình chuyến đi', 'context': 'Our itinerary includes a visit to the museum.'},
    {'word': 'destination', 'type': 'noun', 'definition': 'điểm đến', 'context': 'Paris is a popular tourist destination.'},
    {'word': 'excursion', 'type': 'noun', 'definition': 'chuyến tham quan ngắn', 'context': 'We went on a day excursion to the mountains.'},
    {'word': 'expedition', 'type': 'noun', 'definition': 'cuộc thám hiểm', 'context': 'They planned an expedition to the North Pole.'},
    {'word': 'passenger', 'type': 'noun', 'definition': 'hành khách', 'context': 'All passengers must wear seatbelts.'},
    {'word': 'commute', 'type': 'verb', 'definition': 'đi làm (đi lại thường xuyên)', 'context': 'I commute to London every day by train.'},
    {'word': 'departure', 'type': 'noun', 'definition': 'sự khởi hành', 'context': 'The departure of flight BA123 is delayed.'},
    {'word': 'reservation', 'type': 'noun', 'definition': 'sự đặt chỗ', 'context': 'I have a reservation at the hotel.'},
    {'word': 'scenery', 'type': 'noun', 'definition': 'phong cảnh', 'context': 'The scenery in Switzerland is breathtaking.'},

    # Topic: Personality & Feelings (Tính cách & Cảm xúc)
    {'word': 'ambitious', 'type': 'adjective', 'definition': 'tham vọng', 'context': 'He is very ambitious and wants to be CEO.'},
    {'word': 'generous', 'type': 'adjective', 'definition': 'hào phóng', 'context': 'Thank you for your generous donation.'},
    {'word': 'reliable', 'type': 'adjective', 'definition': 'đáng tin cậy', 'context': 'She is a very reliable employee.'},
    {'word': 'anxious', 'type': 'adjective', 'definition': 'lo lắng', 'context': 'He felt anxious before the interview.'},
    {'word': 'enthusiastic', 'type': 'adjective', 'definition': 'nhiệt tình', 'context': 'The team was enthusiastic about the new project.'},
    {'word': 'stubborn', 'type': 'adjective', 'definition': 'bướng bỉnh', 'context': 'He is too stubborn to admit he was wrong.'},
    {'word': 'confident', 'type': 'adjective', 'definition': 'tự tin', 'context': 'You need to be confident when you speak.'},
    {'word': 'sensitive', 'type': 'adjective', 'definition': 'nhạy cảm', 'context': 'Be careful, he is very sensitive about his height.'},
    {'word': 'sensible', 'type': 'adjective', 'definition': 'khôn ngoan, hợp lý', 'context': 'It was a sensible decision to save money.'},
    {'word': 'curious', 'type': 'adjective', 'definition': 'tò mò', 'context': 'Children are naturally curious about the world.'},

    # Topic: Health & Body (Sức khỏe)
    {'word': 'prescription', 'type': 'noun', 'definition': 'đơn thuốc', 'context': 'The doctor gave me a prescription for antibiotics.'},
    {'word': 'symptom', 'type': 'noun', 'definition': 'triệu chứng', 'context': 'Fever is a common symptom of the flu.'},
    {'word': 'infection', 'type': 'noun', 'definition': 'sự nhiễm trùng', 'context': 'Clean the wound to prevent infection.'},
    {'word': 'diagnosis', 'type': 'noun', 'definition': 'sự chẩn đoán', 'context': 'The early diagnosis saved his life.'},
    {'word': 'treatment', 'type': 'noun', 'definition': 'sự điều trị', 'context': 'She is responding well to the treatment.'},
    {'word': 'recover', 'type': 'verb', 'definition': 'hồi phục', 'context': 'It took him weeks to recover from the surgery.'},
    {'word': 'diet', 'type': 'noun', 'definition': 'chế độ ăn uống', 'context': 'A healthy diet represents a healthy lifestyle.'},
    {'word': 'fitness', 'type': 'noun', 'definition': 'thể lực, sự sung sức', 'context': 'Running improves your physical fitness.'},
    {'word': 'allergy', 'type': 'noun', 'definition': 'dị ứng', 'context': 'I have an allergy to peanuts.'},
    {'word': 'surgeon', 'type': 'noun', 'definition': 'bác sĩ phẫu thuật', 'context': 'The surgeon performed the operation successfully.'},

    # Topic: Technology & Science (Công nghệ)
    {'word': 'innovation', 'type': 'noun', 'definition': 'sự đổi mới', 'context': 'Innovation is key to success in tech.'},
    {'word': 'gadget', 'type': 'noun', 'definition': 'thiết bị (nhỏ, tiện ích)', 'context': 'He loves buying the latest electronic gadgets.'},
    {'word': 'software', 'type': 'noun', 'definition': 'phần mềm', 'context': 'You need to install the antivirus software.'},
    {'word': 'hardware', 'type': 'noun', 'definition': 'phần cứng', 'context': 'The computer hardware needs to be upgraded.'},
    {'word': 'artificial', 'type': 'adjective', 'definition': 'nhân tạo', 'context': 'This juice contains no artificial flavors.'},
    {'word': 'experiment', 'type': 'noun', 'definition': 'thí nghiệm', 'context': 'Scientists are conducting an experiment.'},
    {'word': 'laboratory', 'type': 'noun', 'definition': 'phòng thí nghiệm', 'context': 'Testing is done in a sterile laboratory.'},
    {'word': 'access', 'type': 'noun', 'definition': 'quyền truy cập', 'context': 'Do you have internet access here?'},
    {'word': 'digital', 'type': 'adjective', 'definition': 'kỹ thuật số', 'context': 'We live in a digital age.'},
    {'word': 'invent', 'type': 'verb', 'definition': 'phát minh', 'context': 'Who invented the telephone?'},

    # Topic: Work & Society (Công việc & Xã hội)
    {'word': 'community', 'type': 'noun', 'definition': 'cộng đồng', 'context': 'He is a respected member of the community.'},
    {'word': 'population', 'type': 'noun', 'definition': 'dân số', 'context': 'The population of the city is growing.'},
    {'word': 'tradition', 'type': 'noun', 'definition': 'truyền thống', 'context': 'It is a tradition to wear white at weddings.'},
    {'word': 'culture', 'type': 'noun', 'definition': 'văn hóa', 'context': 'I love learning about Japanese culture.'},
    {'word': 'volunteer', 'type': 'verb', 'definition': 'làm tình nguyện', 'context': 'She volunteers at a soup kitchen on weekends.'},
    {'word': 'citizen', 'type': 'noun', 'definition': 'công dân', 'context': 'He became a US citizen last year.'},
    {'word': 'democracy', 'type': 'noun', 'definition': 'dân chủ', 'context': 'Freedom of speech is vital in a democracy.'},
    {'word': 'unemployment', 'type': 'noun', 'definition': 'sự thất nghiệp', 'context': 'Unemployment rates have fallen recently.'},
    {'word': 'occupation', 'type': 'noun', 'definition': 'nghề nghiệp', 'context': 'Please state your name and occupation.'},
    {'word': 'colleague', 'type': 'noun', 'definition': 'đồng nghiệp', 'context': 'My colleagues are very supportive.'},

    # Topic: Abstract Concepts (Khái niệm trừu tượng)
    {'word': 'advantage', 'type': 'noun', 'definition': 'lợi thế', 'context': 'Being tall is an advantage in basketball.'},
    {'word': 'consequence', 'type': 'noun', 'definition': 'hậu quả', 'context': 'You must accept the consequences of your actions.'},
    {'word': 'variety', 'type': 'noun', 'definition': 'sự đa dạng', 'context': 'The shop offers a wide variety of goods.'},
    {'word': 'prediction', 'type': 'noun', 'definition': 'sự dự đoán', 'context': 'What is your prediction for the match result?'},
    {'word': 'solution', 'type': 'noun', 'definition': 'giải pháp', 'context': 'We need to find a solution to this problem.'},
    {'word': 'opportunity', 'type': 'noun', 'definition': 'cơ hội', 'context': 'This job is a great opportunity for me.'},
    {'word': 'attitude', 'type': 'noun', 'definition': 'thái độ', 'context': 'He has a very positive attitude.'},
    {'word': 'permission', 'type': 'noun', 'definition': 'sự cho phép', 'context': 'You need permission to enter this area.'},
    {'word': 'behavior', 'type': 'noun', 'definition': 'hành vi', 'context': 'His behavior was unacceptable.'},
    {'word': 'knowledge', 'type': 'noun', 'definition': 'kiến thức', 'context': 'Reading books increases your knowledge.'},
    
    # Topic: Arts & Entertainment (Nghệ thuật & Giải trí)
    {'word': 'exhibition', 'type': 'noun', 'definition': 'cuộc triển lãm', 'context': 'There is a new art exhibition at the gallery.'},
    {'word': 'audience', 'type': 'noun', 'definition': 'khán giả', 'context': 'The audience clapped loudly.'},
    {'word': 'performance', 'type': 'noun', 'definition': 'buổi biểu diễn', 'context': 'The band gave an amazing performance.'},
    {'word': 'celebrity', 'type': 'noun', 'definition': 'người nổi tiếng', 'context': 'Many celebrities live in Hollywood.'},
    {'word': 'review', 'type': 'noun', 'definition': 'bài phê bình/đánh giá', 'context': 'The movie received good reviews.'},
    {'word': 'orchestra', 'type': 'noun', 'definition': 'dàn nhạc giao hưởng', 'context': 'He plays the violin in the school orchestra.'},
    {'word': 'sculpture', 'type': 'noun', 'definition': 'tác phẩm điêu khắc', 'context': 'This sculpture was made by Michelangelo.'},
    {'word': 'novel', 'type': 'noun', 'definition': 'tiểu thuyết', 'context': 'She is writing a romance novel.'},
    {'word': 'comedy', 'type': 'noun', 'definition': 'hài kịch', 'context': 'I prefer watching comedy to horror.'},
    {'word': 'festival', 'type': 'noun', 'definition': 'lễ hội', 'context': 'The music festival lasts for three days.'},
]


# 3. KỊCH BẢN (SCRIPT) CHÍNH
def seed_database():
    """
    Hàm này sẽ lặp qua 100 từ, tra cứu thông tin
    và chèn (INSERT) vào bảng PublicWords.
    """
    
    # 4. Import client Quản trị (Admin)
    try:
        from fastapi_app.database import admin_supabase, db_client
        # Ưu tiên dùng admin_supabase
        client_to_use = admin_supabase if admin_supabase else db_client
        
        if not client_to_use:
            raise ImportError("Không tìm thấy client Supabase đã khởi tạo.")
            
        print("Đã import thành công client Supabase của FastAPI.")
    except ImportError as e:
        print(f"LỖI: Không thể import file app. Vui lòng chạy file này từ thư mục gốc 'backend'.")
        print(f"Chi tiết lỗi: {e}")
        sys.exit(1)   
    
    print(f"Chuẩn bị gieo (seed) {len(WORD_DATA)} từ vựng vào Bộ từ (Deck) ID: {DECK_ID_TO_SEED}...")
    
    for i, item in enumerate(WORD_DATA):
        word = item['word']
        definition = item['definition']
        context = item['context']
        word_type = item.get('type') # Lấy loại từ
        
        # Xử lý các từ phức tạp
        word_to_lookup = word.split(' (')[0]
            
        print(f"Đang xử lý từ {i+1}/{len(WORD_DATA)}: '{word}' ({word_type})...")
        
        pronunciation = None
        audio_url = None
        
        try:
            # 5. TÁI SỬ DỤNG LOGIC TRA CỨU
            
            # 5a. Tra cứu Âm thanh (Google TTS & Supabase Storage) 
            safe_word = quote_plus(word_to_lookup)
            google_tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={safe_word}&tl=en&client=tw-ob"
            try:
                headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36" }
                audio_response = requests.get(google_tts_url, headers=headers)
                
                if audio_response.status_code == 200:
                    audio_bytes = audio_response.content
                    file_name = f"{safe_word}_{int(datetime.utcnow().timestamp())}.mp3"
                    
                    client_to_use.storage.from_("audio").upload(
                        file=audio_bytes,
                        path=file_name,
                        file_options={"content-type": "audio/mpeg", "upsert": "true"}
                    )
                    audio_url = client_to_use.storage.from_("audio").get_public_url(file_name)
            except Exception as e:
                print(f"--- Lỗi khi xử lý TTS/Storage cho '{word}': {e}")
                audio_url = None

            #  5b. Tra cứu Phiên âm (Dictionary API) 
            try:
                response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word_to_lookup}")
                if response.status_code == 200:
                    data = response.json()[0]
                    pronunciation = data.get("phonetic")
                    if not pronunciation and data.get("phonetics", []):
                        pronunciation = data["phonetics"][0].get("text")
            except Exception as e:
                print(f"--- Lỗi khi tra cứu phiên âm cho '{word}': {e}")
                pronunciation = None
            
            # --- 6. CHÈN (INSERT) VÀO DATABASE ---
            data_to_insert = {
                "deck_id": DECK_ID_TO_SEED,
                "word": word,
                "type": word_type,  # Thêm trường type
                "definition": definition,
                "context_sentence": context,
                "pronunciation": pronunciation,
                "audio_url": audio_url
            }
            
            client_to_use.table("PublicWords").insert(data_to_insert).execute()
            
            print(f"Đã thêm '{word}' thành công.")
            
            # Tạm dừng 1 giây để tránh bị API chặn (Rate Limit)
            time.sleep(1) 
            
        except Exception as e:
            print(f"!!! Lỗi TỔNG KHI THÊM TỪ '{word}': {e}")
            
    print("Hoàn tất! Dữ liệu đã được gieo (seed) vào database.")

# 7. Chạy script
if __name__ == "__main__":
    seed_database()