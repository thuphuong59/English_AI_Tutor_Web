import sys
import time
import requests
from datetime import datetime
from urllib.parse import quote_plus

# === CẤU HÌNH ===
DECK_ID_TO_SEED = 1 
# === KẾT THÚC CẤU HÌNH ===

# 2. DANH SÁCH 100 TỪ VỰNG MẪU (Đã thêm 'type')
WORD_DATA = [
    # Nouns (Danh từ)
    {'word': 'apple', 'type': 'noun', 'definition': 'quả táo', 'context': 'I eat an apple every day.'},
    {'word': 'baby', 'type': 'noun', 'definition': 'em bé', 'context': 'The baby is sleeping.'},
    {'word': 'book', 'type': 'noun', 'definition': 'quyển sách', 'context': 'I am reading a good book.'},
    {'word': 'car', 'type': 'noun', 'definition': 'xe ô tô', 'context': 'He bought a new car.'},
    {'word': 'cat', 'type': 'noun', 'definition': 'con mèo', 'context': 'My cat is black.'},
    {'word': 'city', 'type': 'noun', 'definition': 'thành phố', 'context': 'Da Nang is a beautiful city.'},
    {'word': 'country', 'type': 'noun', 'definition': 'đất nước', 'context': 'Vietnam is my country.'},
    {'word': 'day', 'type': 'noun', 'definition': 'ngày', 'context': 'Today is a beautiful day.'},
    {'word': 'dog', 'type': 'noun', 'definition': 'con chó', 'context': 'The dog is barking.'},
    {'word': 'email', 'type': 'noun', 'definition': 'thư điện tử', 'context': 'Please send me an email.'},
    {'word': 'family', 'type': 'noun', 'definition': 'gia đình', 'context': 'My family lives in Hanoi.'},
    {'word': 'food', 'type': 'noun', 'definition': 'thức ăn', 'context': 'What is your favorite food?'},
    {'word': 'friend', 'type': 'noun', 'definition': 'bạn bè', 'context': 'He is my best friend.'},
    {'word': 'game', 'type': 'noun', 'definition': 'trò chơi', 'context': 'Let\'s play a game.'},
    {'word': 'house', 'type': 'noun', 'definition': 'ngôi nhà', 'context': 'They live in a big house.'},
    {'word': 'job', 'type': 'noun', 'definition': 'công việc', 'context': 'She is looking for a new job.'},
    {'word': 'language', 'type': 'noun', 'definition': 'ngôn ngữ', 'context': 'English is an international language.'},
    {'word': 'man', 'type': 'noun', 'definition': 'đàn ông', 'context': 'A man is walking down the street.'},
    {'word': 'money', 'type': 'noun', 'definition': 'tiền', 'context': 'I need to save more money.'},
    {'word': 'morning', 'type': 'noun', 'definition': 'buổi sáng', 'context': 'I wake up early in the morning.'},
    {'word': 'name', 'type': 'noun', 'definition': 'tên', 'context': 'What\'s your name?'},
    {'word': 'night', 'type': 'noun', 'definition': 'ban đêm', 'context': 'The stars are bright at night.'},
    {'word': 'people', 'type': 'noun', 'definition': 'con người/người ta', 'context': 'There are many people here.'},
    {'word': 'phone', 'type': 'noun', 'definition': 'điện thoại', 'context': 'My phone is new.'},
    {'word': 'school', 'type': 'noun', 'definition': 'trường học', 'context': 'Children go to school every day.'},
    {'word': 'student', 'type': 'noun', 'definition': 'học sinh, sinh viên', 'context': 'He is a student at the university.'},
    {'word': 'teacher', 'type': 'noun', 'definition': 'giáo viên', 'context': 'My teacher is very kind.'},
    {'word': 'time', 'type': 'noun', 'definition': 'thời gian', 'context': 'What time is it?'},
    {'word': 'today', 'type': 'noun', 'definition': 'hôm nay', 'context': 'What are you doing today?'},
    {'word': 'tomorrow', 'type': 'noun', 'definition': 'ngày mai', 'context': 'See you tomorrow!'},
    {'word': 'water', 'type': 'noun', 'definition': 'nước', 'context': 'Please drink a lot of water.'},
    {'word': 'woman', 'type': 'noun', 'definition': 'phụ nữ', 'context': 'That woman is a doctor.'},
    {'word': 'work', 'type': 'noun', 'definition': 'công việc', 'context': 'I have a lot of work to do.'},
    {'word': 'world', 'type': 'noun', 'definition': 'thế giới', 'context': 'The world is a big place.'},
    {'word': 'year', 'type': 'noun', 'definition': 'năm', 'context': 'This year is 2025.'},
    
    # Verbs (Động từ)
    {'word': 'be', 'type': 'verb', 'definition': 'thì, là, ở', 'context': 'She is a teacher. I am happy.'},
    {'word': 'have', 'type': 'verb', 'definition': 'có', 'context': 'I have a pen.'},
    {'word': 'do', 'type': 'verb', 'definition': 'làm', 'context': 'What are you doing?'},
    {'word': 'say', 'type': 'verb', 'definition': 'nói', 'context': 'Please say it again.'},
    {'word': 'go', 'type': 'verb', 'definition': 'đi', 'context': 'I go to work by bus.'},
    {'word': 'get', 'type': 'verb', 'definition': 'có được, nhận', 'context': 'I get many gifts on my birthday.'},
    {'word': 'make', 'type': 'verb', 'definition': 'làm, chế tạo', 'context': 'She made a cake.'},
    {'word': 'know', 'type': 'verb', 'definition': 'biết', 'context': 'I know his name.'},
    {'word': 'think', 'type': 'verb', 'definition': 'nghĩ', 'context': 'What do you think?'},
    {'word': 'take', 'type': 'verb', 'definition': 'lấy, cầm', 'context': 'Please take this book.'},
    {'word': 'see', 'type': 'verb', 'definition': 'nhìn, thấy', 'context': 'I can see the beach from here.'},
    {'word': 'come', 'type': 'verb', 'definition': 'đến', 'context': 'Are you coming to the party?'},
    {'word': 'want', 'type': 'verb', 'definition': 'muốn', 'context': 'I want a cup of coffee.'},
    {'word': 'look', 'type': 'verb', 'definition': 'nhìn', 'context': 'Look at that beautiful bird!'},
    {'word': 'use', 'type': 'verb', 'definition': 'sử dụng', 'context': 'Can I use your phone?'},
    {'word': 'find', 'type': 'verb', 'definition': 'tìm thấy', 'context': 'I can\'t find my keys.'},
    {'word': 'give', 'type': 'verb', 'definition': 'cho', 'context': 'He gave me a gift.'},
    {'word': 'tell', 'type': 'verb', 'definition': 'nói, kể', 'context': 'Please tell me the truth.'},
    {'word': 'work', 'type': 'verb', 'definition': 'làm việc', 'context': 'I work from 9 to 5.'},
    {'word': 'call', 'type': 'verb', 'definition': 'gọi điện', 'context': 'I will call you later.'},
    {'word': 'try', 'type': 'verb', 'definition': 'thử, cố gắng', 'context': 'You should try this food.'},
    {'word': 'ask', 'type': 'verb', 'definition': 'hỏi', 'context': 'He asked me a question.'},
    {'word': 'need', 'type': 'verb', 'definition': 'cần', 'context': 'I need some help.'},
    {'word': 'feel', 'type': 'verb', 'definition': 'cảm thấy', 'context': 'How do you feel today?'},
    {'word': 'become', 'type': 'verb', 'definition': 'trở thành', 'context': 'He wants to become a doctor.'},
    {'word': 'leave', 'type': 'verb', 'definition': 'rời đi', 'context': 'The train leaves at 10 AM.'},
    {'word': 'put', 'type': 'verb', 'definition': 'đặt, để', 'context': 'Please put the book on the table.'},
    {'word': 'mean', 'type': 'verb', 'definition': 'có nghĩa là', 'context': 'What does this word mean?'},
    {'word': 'keep', 'type': 'verb', 'definition': 'giữ', 'context': 'You can keep the change.'},
    {'word': 'let', 'type': 'verb', 'definition': 'để, cho phép', 'context': 'Let me help you.'},
    {'word': 'begin', 'type': 'verb', 'definition': 'bắt đầu', 'context': 'The class begins at 8 AM.'},
    {'word': 'seem', 'type': 'verb', 'definition': 'dường như, có vẻ', 'context': 'You seem tired.'},
    {'word': 'help', 'type': 'verb', 'definition': 'giúp đỡ', 'context': 'Can you help me?'},
    {'word': 'talk', 'type': 'verb', 'definition': 'nói chuyện', 'context': 'We talked for hours.'},
    {'word': 'turn', 'type': 'verb', 'definition': 'rẽ, xoay', 'context': 'Turn left at the corner.'},
    {'word': 'start', 'type': 'verb', 'definition': 'bắt đầu', 'context': 'The movie starts at 7 PM.'},
    {'word': 'show', 'type': 'verb', 'definition': 'cho xem, chỉ', 'context': 'Can you show me the way?'},
    {'word': 'hear', 'type': 'verb', 'definition': 'nghe', 'context': 'I can\'t hear you.'},
    {'word': 'play', 'type': 'verb', 'definition': 'chơi', 'context': 'Children like to play football.'},
    {'word': 'run', 'type': 'verb', 'definition': 'chạy', 'context': 'I run every morning.'},
    {'word': 'move', 'type': 'verb', 'definition': 'di chuyển', 'context': 'Please move your car.'},
    {'word': 'live', 'type': 'verb', 'definition': 'sống', 'context': 'Where do you live?'},
    {'word': 'believe', 'type': 'verb', 'definition': 'tin tưởng', 'context': 'I believe you.'},

    # Adjectives (Tính từ)
    {'word': 'good', 'type': 'adjective', 'definition': 'tốt', 'context': 'This food is very good.'},
    {'word': 'new', 'type': 'adjective', 'definition': 'mới', 'context': 'I bought a new shirt.'},
    {'word': 'first', 'type': 'adjective', 'definition': 'đầu tiên', 'context': 'This is my first time here.'},
    {'word': 'last', 'type': 'adjective', 'definition': 'cuối cùng', 'context': 'This is the last page.'},
    {'word': 'long', 'type': 'adjective', 'definition': 'dài', 'context': 'It\'s a long story.'},
    {'word': 'great', 'type': 'adjective', 'definition': 'tuyệt vời', 'context': 'We had a great time.'},
    {'word': 'little', 'type': 'adjective', 'definition': 'nhỏ, một ít', 'context': 'I need a little help.'},
    {'word': 'own', 'type': 'adjective', 'definition': 'sở hữu, của riêng', 'context': 'This is my own car.'},
    {'word': 'other', 'type': 'adjective', 'definition': 'khác', 'context': 'Do you have any other questions?'},
    {'word': 'old', 'type': 'adjective', 'definition': 'cũ, già', 'context': 'My grandfather is very old.'},
    {'word': 'right', 'type': 'adjective', 'definition': 'đúng, bên phải', 'context': 'You are right.'},
    {'word': 'big', 'type': 'adjective', 'definition': 'to, lớn', 'context': 'That is a big building.'},
    {'word': 'high', 'type': 'adjective', 'definition': 'cao', 'context': 'The mountain is very high.'},
    {'word': 'different', 'type': 'adjective', 'definition': 'khác biệt', 'context': 'My opinion is different from yours.'},
    {'word': 'small', 'type': 'adjective', 'definition': 'nhỏ', 'context': 'I live in a small apartment.'},
    {'word': 'large', 'type': 'adjective', 'definition': 'rộng, lớn', 'context': 'We have a large garden.'},
    {'word': 'next', 'type': 'adjective', 'definition': 'tiếp theo', 'context': 'See you next week.'},
    {'word': 'early', 'type': 'adjective', 'definition': 'sớm', 'context': 'I woke up early today.'},
    {'word': 'young', 'type': 'adjective', 'definition': 'trẻ', 'context': 'She is a young doctor.'},
    {'word': 'important', 'type': 'adjective', 'definition': 'quan trọng', 'context': 'Health is very important.'},
]

# 3. KỊCH BẢN (SCRIPT) CHÍNH
def seed_database():
    """
    Hàm này sẽ lặp qua 100 từ, tra cứu thông tin
    và chèn (INSERT) vào bảng PublicWords.
    """
    
    # 4. SỬA LỖI: Import cả 'admin_supabase'
    try:
        from fastapi_app.database import admin_supabase
    except ImportError as e:
        print(f"LỖI: Không thể import file app. Vui lòng chạy file này từ thư mục gốc 'backend'.")
        print(f"Chi tiết lỗi: {e}")
        sys.exit(1)
        
    # 5. SỬA LỖI: Kiểm tra xem admin client có tồn tại không
    if not admin_supabase:
        print("LỖI: 'admin_supabase' client không được khởi tạo.")
        print("Hãy đảm bảo SUPABASE_SERVICE_KEY đã có trong file .env của bạn!")
        sys.exit(1)
    
    # 6. SỬA LỖI: Dùng 'admin_supabase' (client Quản trị)
    # Client này sẽ BỎ QUA (bypass) tất cả các chính sách RLS
    db_client = admin_supabase 
    
    print(f"Chuẩn bị gieo (seed) {len(WORD_DATA)} từ vựng vào Bộ từ (Deck) ID: {DECK_ID_TO_SEED}...")
    
    for i, item in enumerate(WORD_DATA):
        word = item['word']
        definition = item['definition']
        context = item['context']
        word_type = item.get('type') # Lấy loại từ
        
        print(f"Đang xử lý từ {i+1}/{len(WORD_DATA)}: '{word}' ({word_type})...")
        
        pronunciation = None
        audio_url = None
        
        try:
            # === 7. COPY LOGIC TỪ 'SERVICES' VÀO ĐÂY ===
            # TỰ TẠO LINK ÂM THANH (GOOGLE TTS)
            safe_word = quote_plus(word)
            google_tts_url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={safe_word}&tl=en&client=tw-ob"
            
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
                }
                audio_response = requests.get(google_tts_url, headers=headers)
                
                if audio_response.status_code == 200:
                    audio_bytes = audio_response.content
                    file_name = f"{safe_word}_{int(datetime.utcnow().timestamp())}.mp3"
                    
                    # 8. SỬA LỖI: Dùng 'db_client' (admin) để upload
                    db_client.storage.from_("audio").upload(
                        file=audio_bytes,
                        path=file_name,
                        file_options={"content-type": "audio/mpeg", "upsert": "true"}
                    )
                    audio_url = db_client.storage.from_("audio").get_public_url(file_name)
            
            except Exception as e:
                print(f"--- Lỗi khi xử lý TTS/Storage cho '{word}': {e}")
                audio_url = None

            # LẤY PHIÊN ÂM
            try:
                response = requests.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}")
                if response.status_code == 200:
                    data = response.json()[0]
                    pronunciation = data.get("phonetic")
                    if not pronunciation and data.get("phonetics", []):
                        pronunciation = data["phonetics"][0].get("text")
            except Exception as e:
                print(f"--- Lỗi khi tra cứu phiên âm cho '{word}': {e}")
                pronunciation = None
            
            # 9. Dữ liệu để chèn (INSERT)
            data_to_insert = {
                "deck_id": DECK_ID_TO_SEED,
                "word": word,
                "type": word_type, # Thêm loại từ vào DB
                "definition": definition,
                "context_sentence": context,
                "pronunciation": pronunciation,
                "audio_url": audio_url
            }
            
            # 10. SỬA LỖI: Dùng 'db_client' (admin) để insert
            db_client.table("PublicWords").insert(data_to_insert).execute()
            
            print(f"Đã thêm '{word}' thành công.")
            
            # Tạm dừng 1 giây để tránh bị API chặn (Rate Limit)
            time.sleep(1) 
            
        except Exception as e:
            print(f"!!! Lỗi TỔNG KHI THÊM TỪ '{word}': {e}")
            
    print("Hoàn tất! Dữ liệu đã được gieo (seed) vào database.")

# 11. Chạy script
if __name__ == "__main__":
    seed_database()