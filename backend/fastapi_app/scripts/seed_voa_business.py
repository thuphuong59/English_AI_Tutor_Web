import sys
import time
import requests 
from datetime import datetime
from urllib.parse import quote_plus

# === CẤU HÌNH ===
# !!! QUAN TRỌNG: Hãy thay số 2 này bằng ID của bộ từ 'VOA - Business' bạn vừa tạo ở Bước 1
DECK_ID_TO_SEED = 3 
# === KẾT THÚC CẤU HÌNH ===


# 2. DANH SÁCH 100 TỪ VỰNG BUSINESS (B1/B2)
WORD_DATA = [
    # General Business (Tổng quát)
    {'word': 'company', 'type': 'noun', 'definition': 'công ty', 'context': 'He works for a software company.'},
    {'word': 'business', 'type': 'noun', 'definition': 'kinh doanh, doanh nghiệp', 'context': 'She started her own business last year.'},
    {'word': 'strategy', 'type': 'noun', 'definition': 'chiến lược', 'context': 'We need a new marketing strategy.'},
    {'word': 'management', 'type': 'noun', 'definition': 'ban quản lý', 'context': 'Management is deciding on the new policy.'},
    {'word': 'policy', 'type': 'noun', 'definition': 'chính sách', 'context': 'What is the company\'s policy on remote work?'},
    {'word': 'industry', 'type': 'noun', 'definition': 'ngành công nghiệp', 'context': 'He works in the technology industry.'},
    {'word': 'competitor', 'type': 'noun', 'definition': 'đối thủ cạnh tranh', 'context': 'We must stay ahead of our competitors.'},
    {'word': 'profit', 'type': 'noun', 'definition': 'lợi nhuận', 'context': 'The company made a large profit this year.'},
    {'word': 'revenue', 'type': 'noun', 'definition': 'doanh thu', 'context': 'Revenue has increased by 10%.'},
    {'word': 'loss', 'type': 'noun', 'definition': 'thua lỗ', 'context': 'We reported a net loss of $1 million.'},
    {'word': 'asset', 'type': 'noun', 'definition': 'tài sản', 'context': 'The company\'s assets are worth millions.'},
    {'word': 'liability', 'type': 'noun', 'definition': 'công nợ, trách nhiệm pháp lý', 'context': 'The company has significant financial liabilities.'},
    {'word': 'headquarters', 'type': 'noun', 'definition': 'trụ sở chính', 'context': 'The company\'s headquarters are in New York.'},
    {'word': 'branch', 'type': 'noun', 'definition': 'chi nhánh', 'context': 'They just opened a new branch in Da Nang.'},
    {'word': 'customer', 'type': 'noun', 'definition': 'khách hàng (mua sản phẩm)', 'context': 'The customer is always right.'},
    {'word': 'client', 'type': 'noun', 'definition': 'khách hàng (dùng dịch vụ)', 'context': 'The lawyer is meeting with a client.'},
    {'word': 'supplier', 'type': 'noun', 'definition': 'nhà cung cấp', 'context': 'We need to find a new supplier for raw materials.'},
    {'word': 'market', 'type': 'noun', 'definition': 'thị trường', 'context': 'We are targeting the youth market.'},
    {'word': 'shareholder', 'type': 'noun', 'definition': 'cổ đông', 'context': 'The shareholders will vote on the proposal.'},
    {'word': 'stakeholder', 'type': 'noun', 'definition': 'bên liên quan', 'context': 'We must consider all stakeholders, including employees.'},

    # Meetings & Communication (Họp & Giao tiếp)
    {'word': 'agenda', 'type': 'noun', 'definition': 'chương trình nghị sự', 'context': 'What is the first item on the agenda?'},
    {'word': 'minutes', 'type': 'noun', 'definition': 'biên bản cuộc họp', 'context': 'Who is taking the minutes for this meeting?'},
    {'word': 'presentation', 'type': 'noun', 'definition': 'bài thuyết trình', 'context': 'She gave an excellent presentation on the new product.'},
    {'word': 'negotiate', 'type': 'verb', 'definition': 'đàm phán', 'context': 'We need to negotiate the terms of the contract.'},
    {'word': 'agreement', 'type': 'noun', 'definition': 'sự thoả thuận, hợp đồng', 'context': 'We finally reached an agreement.'},
    {'word': 'contract', 'type': 'noun', 'definition': 'hợp đồng', 'context': 'You must sign the contract before starting work.'},
    {'word': 'proposal', 'type': 'noun', 'definition': 'bản đề xuất', 'context': 'The marketing team submitted a new proposal.'},
    {'word': 'feedback', 'type': 'noun', 'definition': 'phản hồi, góp ý', 'context': 'We received positive feedback from our clients.'},
    {'word': 'brainstorm', 'type': 'verb', 'definition': 'động não, nghĩ ý tưởng', 'context': 'Let\'s brainstorm some ideas for the new campaign.'},
    {'word': 'conference', 'type': 'noun', 'definition': 'hội nghị', 'context': 'He is attending a business conference in Singapore.'},
    {'word': 'deadline', 'type': 'noun', 'definition': 'hạn chót', 'context': 'The deadline for this project is Friday.'},
    {'word': 'objective', 'type': 'noun', 'definition': 'mục tiêu', 'context': 'Our main objective is to increase sales.'},
    {'word': 'goal', 'type': 'noun', 'definition': 'mục đích, mục tiêu', 'context': 'The company\'s goal is to expand globally.'},
    {'word': 'participant', 'type': 'noun', 'definition': 'người tham gia', 'context': 'How many participants will be at the workshop?'},
    {'word': 'consensus', 'type': 'noun', 'definition': 'sự đồng thuận', 'context': 'After a long discussion, we reached a consensus.'},
    {'word': 'clarify', 'type': 'verb', 'definition': 'làm rõ', 'context': 'Could you clarify what you mean by "urgent"?'},
    {'word': 'colleague', 'type': 'noun', 'definition': 'đồng nghiệp', 'context': 'I am having lunch with a colleague.'},
    {'word': 'follow-up', 'type': 'noun', 'definition': 'theo dõi (sau đó)', 'context': 'I will send a follow-up email tomorrow.'},
    {'word': 'schedule', 'type': 'noun', 'definition': 'lịch trình / lên lịch', 'context': 'What is your schedule for next week?'},
    {'word': 'postpone', 'type': 'verb', 'definition': 'trì hoãn', 'context': 'We have to postpone the meeting until next Monday.'},

    # Finance & Economics (Tài chính & Kinh tế)
    {'word': 'budget', 'type': 'noun', 'definition': 'ngân sách', 'context': 'We need to stay within the budget.'},
    {'word': 'investment', 'type': 'noun', 'definition': 'sự đầu tư', 'context': 'This is a high-risk investment.'},
    {'word': 'stock', 'type': 'noun', 'definition': 'cổ phiếu', 'context': 'He invested all his money in stocks.'},
    {'word': 'share', 'type': 'noun', 'definition': 'cổ phần', 'context': 'She owns 1,000 shares of the company.'},
    {'word': 'dividend', 'type': 'noun', 'definition': 'cổ tức', 'context': 'The company will pay a dividend to its shareholders.'},
    {'word': 'interest', 'type': 'noun', 'definition': 'lãi suất', 'context': 'The bank offers a 5% interest rate on savings.'},
    {'word': 'loan', 'type': 'noun', 'definition': 'khoản vay', 'context': 'He took out a loan to buy a house.'},
    {'word': 'mortgage', 'type': 'noun', 'definition': 'khoản vay thế chấp', 'context': 'They have a 30-year mortgage on their home.'},
    {'word': 'invoice', 'type': 'noun', 'definition': 'hoá đơn', 'context': 'Please send the invoice to the accounting department.'},
    {'word': 'receipt', 'type': 'noun', 'definition': 'biên lai (đã trả tiền)', 'context': 'Can I have a receipt, please?'},
    {'word': 'audit', 'type': 'noun', 'definition': 'kiểm toán', 'context': 'The company undergoes an external audit every year.'},
    {'word': 'payroll', 'type': 'noun', 'definition': 'bảng lương', 'context': 'The payroll is processed on the 25th of each month.'},
    {'word': 'tax', 'type': 'noun', 'definition': 'thuế', 'context': 'Everyone has to pay income tax.'},
    {'word': 'inflation', 'type': 'noun', 'definition': 'lạm phát', 'context': 'Inflation is rising, so prices are going up.'},
    {'word': 'recession', 'type': 'noun', 'definition': 'suy thoái kinh tế', 'context': 'The country is in an economic recession.'},
    {'word': 'equity', 'type': 'noun', 'definition': 'vốn chủ sở hữu', 'context': 'He sold his equity in the company.'},
    {'word': 'capital', 'type': 'noun', 'definition': 'vốn', 'context': 'We need to raise more capital for the new project.'},
    {'word': 'venture', 'type': 'noun', 'definition': 'mạo hiểm (kinh doanh)', 'context': 'He is starting a new business venture.'},
    {'word': 'quarter', 'type': 'noun', 'definition': 'quý (3 tháng)', 'context': 'The company\'s sales were strong in the third quarter.'},
    {'word': 'fiscal year', 'type': 'noun', 'definition': 'năm tài chính', 'context': 'Our fiscal year ends on December 31st.'},

    # Marketing & Sales (Tiếp thị & Bán hàng)
    {'word': 'brand', 'type': 'noun', 'definition': 'thương hiệu', 'context': 'Nike is a very famous brand.'},
    {'word': 'advertising', 'type': 'noun', 'definition': 'quảng cáo', 'context': 'They spent a lot of money on advertising.'},
    {'word': 'campaign', 'type': 'noun', 'definition': 'chiến dịch', 'context': 'The new advertising campaign was successful.'},
    {'word': 'target audience', 'type': 'noun', 'definition': 'khán giả mục tiêu', 'context': 'Our target audience is young people aged 18-25.'},
    {'word': 'market research', 'type': 'noun', 'definition': 'nghiên cứu thị trường', 'context': 'Market research shows a growing demand for this product.'},
    {'word': 'demographics', 'type': 'noun', 'definition': 'nhân khẩu học', 'context': 'The demographics of this area are changing.'},
    {'word': 'logo', 'type': 'noun', 'definition': 'biểu tượng (logo)', 'context': 'The Apple logo is recognized worldwide.'},
    {'word': 'slogan', 'type': 'noun', 'definition': 'khẩu hiệu', 'context': 'Nike\'s slogan is "Just Do It."'},
    {'word': 'product', 'type': 'noun', 'definition': 'sản phẩm', 'context': 'We are launching a new product next month.'},
    {'word': 'launch', 'type': 'noun', 'definition': 'ra mắt, tung ra', 'context': 'The launch of the new iPhone was a huge event.'},
    {'word': 'distribution', 'type': 'noun', 'definition': 'sự phân phối', 'context': 'We need to improve our distribution network.'},
    {'word': 'retail', 'type': 'noun', 'definition': 'bán lẻ', 'context': 'The retail price is $50.'},
    {'word': 'wholesale', 'type': 'noun', 'definition': 'bán sỉ, bán buôn', 'context': 'We buy the goods at wholesale and sell them retail.'},
    {'word': 'promotion', 'type': 'noun', 'definition': 'khuyến mãi', 'context': 'There is a special promotion this week.'},
    {'word': 'discount', 'type': 'noun', 'definition': 'giảm giá', 'context': 'Do you offer a discount for students?'},
    {'word': 'customer service', 'type': 'noun', 'definition': 'dịch vụ khách hàng', 'context': 'They are famous for their excellent customer service.'},
    {'word': 'lead', 'type': 'noun', 'definition': 'khách hàng tiềm năng (đã có thông tin)', 'context': 'The sales team generated 50 new leads this week.'},
    {'word': 'prospect', 'type': 'noun', 'definition': 'khách hàng tiềm năng (chưa liên hệ)', 'context': 'I have a list of prospects to call today.'},
    {'word': 'close (a deal)', 'type': 'verb', 'definition': 'chốt (giao dịch)', 'context': 'She successfully closed the deal after weeks of negotiation.'},
    {'word': 'sales pitch', 'type': 'noun', 'definition': 'bài chào hàng', 'context': 'He practiced his sales pitch before the meeting.'},

    # Human Resources (HR) & Workplace (Nhân sự & Nơi làm việc)
    {'word': 'recruitment', 'type': 'noun', 'definition': 'tuyển dụng', 'context': 'The company is starting a new recruitment drive.'},
    {'word': 'interview', 'type': 'noun', 'definition': 'phỏng vấn', 'context': 'I have a job interview tomorrow.'},
    {'word': 'hire', 'type': 'verb', 'definition': 'thuê, tuyển', 'context': 'We need to hire more staff.'},
    {'word': 'fire', 'type': 'verb', 'definition': 'sa thải', 'context': 'They fired him for stealing.'},
    {'word': 'resign', 'type': 'verb', 'definition': 'từ chức', 'context': 'He resigned from his job yesterday.'},
    {'word': 'retire', 'type': 'verb', 'definition': 'về hưu', 'context': 'My father will retire next year.'},
    {'word': 'salary', 'type': 'noun', 'definition': 'lương (trả hàng tháng)', 'context': 'She has a very high salary.'},
    {'word': 'bonus', 'type': 'noun', 'definition': 'tiền thưởng', 'context': 'Employees received a large bonus at the end of the year.'},
    {'word': 'perks', 'type': 'noun', 'definition': 'đặc quyền, phúc lợi (nhỏ)', 'context': 'Free coffee is one of the perks of the job.'},
    {'word': 'benefits', 'type': 'noun', 'definition': 'phúc lợi (lớn)', 'context': 'The job offers great benefits, like health insurance.'},
    {'word': 'promotion', 'type': 'noun', 'definition': 'sự thăng chức', 'context': 'He received a promotion to Senior Manager.'},
    {'word': 'performance review', 'type': 'noun', 'definition': 'đánh giá hiệu suất', 'context': 'My performance review is next week.'},
    {'word': 'training', 'type': 'noun', 'definition': 'đào tạo', 'context': 'All new employees must complete the safety training.'},
    {'word': 'remote work', 'type': 'noun', 'definition': 'làm việc từ xa', 'context': 'Our company allows remote work two days a week.'},
    {'word': 'flexible hours', 'type': 'noun', 'definition': 'giờ làm việc linh hoạt', 'context': 'This job offers flexible hours.'},
    {'word': 'corporate culture', 'type': 'noun', 'definition': 'văn hoá doanh nghiệp', 'context': 'It\'s important to fit in with the corporate culture.'},
    {'word': 'employee', 'type': 'noun', 'definition': 'nhân viên', 'context': 'He is a new employee.'},
    {'word': 'employer', 'type': 'noun', 'definition': 'người sử dụng lao động, sếp', 'context': 'My employer is very understanding.'},
    {'word': 'CV (resume)', 'type': 'noun', 'definition': 'sơ yếu lý lịch', 'context': 'Please send your CV to the HR department.'},
    {'word': 'application', 'type': 'noun', 'definition': 'đơn xin việc', 'context': 'I submitted my job application online.'},
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
        
        # Xử lý các từ phức tạp (ví dụ: 'close (a deal)')
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
                elif word_to_lookup == "CV (resume)": # Xử lý ngoại lệ
                    pronunciation = "/ˌsiːˈviː/ /ˌrɛzəˈmeɪ/"
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