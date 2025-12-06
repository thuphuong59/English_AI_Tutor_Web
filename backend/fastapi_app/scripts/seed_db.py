import os
import sys
from dotenv import load_dotenv, find_dotenv

env_file_path = find_dotenv()
if not env_file_path:
    print("❌ LỖI: Không tìm thấy file .env.")
    sys.exit(1)

load_dotenv(dotenv_path=env_file_path)
project_root = os.path.dirname(env_file_path)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    from fastapi_app.crud import scenarios as crud_scenarios
    from fastapi_app.database import db_client as supabase
    print("[*] Kết nối Supabase thành công.")
except ImportError as e:
    print(f"❌ Lỗi Import: {e}")
    sys.exit(1)

ALL_SCENARIOS = [
    {
        "topic": "Family", "level": "Beginner", "title": "Describing a Friend",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Tell me about your best friend."},
            {"turn": 2, "speaker": "user", "line": "Her name is Lan. She is very kind."},
            {"turn": 3, "speaker": "ai", "line": "What does she look like?"},
            {"turn": 4, "speaker": "user", "line": "She is tall and has long black hair."},
            {"turn": 5, "speaker": "ai", "line": "Is she funny?"},
            {"turn": 6, "speaker": "user", "line": "Yes, she always makes me laugh."},
        ]
    },
    {
        "topic": "Hobbies", "level": "Beginner", "title": "Favorite Sport",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Do you like sports?"},
            {"turn": 2, "speaker": "user", "line": "Yes, I like playing soccer."},
            {"turn": 3, "speaker": "ai", "line": "How often do you play?"},
            {"turn": 4, "speaker": "user", "line": "I play every Saturday with my friends."},
            {"turn": 5, "speaker": "ai", "line": "That sounds fun. Are you good at it?"},
            {"turn": 6, "speaker": "user", "line": "I am okay, but I just play for fun."},
        ]
    },
    {
        "topic": "Daily Life", "level": "Beginner", "title": "Morning Routine",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "What time do you wake up?"},
            {"turn": 2, "speaker": "user", "line": "I usually wake up at 6 AM."},
            {"turn": 3, "speaker": "ai", "line": "What do you do first?"},
            {"turn": 4, "speaker": "user", "line": "I brush my teeth and wash my face."},
            {"turn": 5, "speaker": "ai", "line": "Do you eat breakfast?"},
            {"turn": 6, "speaker": "user", "line": "Yes, I eat bread and drink milk."},
        ]
    },
    {
        "topic": "Technology", "level": "Advanced", "title": "Ethics of Genetic Engineering",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "What are your thoughts on CRISPR and gene editing in humans?"},
            {"turn": 2, "speaker": "user", "line": "It offers immense potential for curing hereditary diseases, which is a noble goal."},
            {"turn": 3, "speaker": "ai", "line": "However, the slippery slope towards 'designer babies' is a significant ethical concern."},
            {"turn": 4, "speaker": "user", "line": "I agree. Altering traits for enhancement rather than therapy could exacerbate social inequalities."},
            {"turn": 5, "speaker": "ai", "line": "Do you think we need a global moratorium on germline editing?"},
            {"turn": 6, "speaker": "user", "line": "Yes, until we fully understand the long-term consequences and have a robust ethical framework."},
        ]
    },
    {
        "topic": "Society", "level": "Advanced", "title": "Universal Basic Income",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "With automation replacing jobs, is Universal Basic Income a necessity?"},
            {"turn": 2, "speaker": "user", "line": "It seems like a logical solution to prevent mass poverty in an automated future."},
            {"turn": 3, "speaker": "ai", "line": "Critics argue it might disincentivize work and stifle innovation."},
            {"turn": 4, "speaker": "user", "line": "On the contrary, financial security could empower people to pursue creative or entrepreneurial risks."},
            {"turn": 5, "speaker": "ai", "line": "The funding model is the biggest hurdle. Taxing robots or wealth?"},
            {"turn": 6, "speaker": "user", "line": "Likely a combination. We need to redefine the social contract for the 21st century."},
        ]
    },
    {
        "topic": "Environment", "level": "Advanced", "title": "Space Exploration vs Earth Conservation",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Should we spend billions on colonizing Mars when Earth has so many problems?"},
            {"turn": 2, "speaker": "user", "line": "It's a classic dilemma. However, space exploration drives technological innovation that can help Earth."},
            {"turn": 3, "speaker": "ai", "line": "True, satellite technology monitoring climate change is a prime example."},
            {"turn": 4, "speaker": "user", "line": "Exactly. But we cannot use Mars as a 'Plan B' to justify destroying our current home."},
            {"turn": 5, "speaker": "ai", "line": "So you see them as complementary goals rather than mutually exclusive?"},
            {"turn": 6, "speaker": "user", "line": "Precisely. We must protect the biosphere while expanding our horizons as a species."},
        ]
    },
    {
        "topic": "Family", "level": "Beginner", "title": "Talking About Pets",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Do you have any pets at home?"},
            {"turn": 2, "speaker": "user", "line": "Yes, I have a dog."},
            {"turn": 3, "speaker": "ai", "line": "That is nice! What is its name?"},
            {"turn": 4, "speaker": "user", "line": "His name is Milo. He is very friendly."},
            {"turn": 5, "speaker": "ai", "line": "I love dogs. Is he big or small?"},
            {"turn": 6, "speaker": "user", "line": "He is small and has white fur."},
        ]
    },
    {
        "topic": "Hobbies", "level": "Beginner", "title": "Do You Like Music?",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Do you like listening to music?"},
            {"turn": 2, "speaker": "user", "line": "Yes, I love music very much."},
            {"turn": 3, "speaker": "ai", "line": "What kind of music do you like?"},
            {"turn": 4, "speaker": "user", "line": "I like pop music and rock music."},
            {"turn": 5, "speaker": "ai", "line": "Who is your favorite singer?"},
            {"turn": 6, "speaker": "user", "line": "I really like Taylor Swift."},
        ]
    },
    {
        "topic": "Daily Life", "level": "Beginner", "title": "Asking for the Time",
        "dialogues": [
            {"turn": 1, "speaker": "user", "line": "Excuse me. Do you have the time?"},
            {"turn": 2, "speaker": "ai", "line": "Yes. It is half past three."},
            {"turn": 3, "speaker": "user", "line": "Thank you. My phone is dead."},
            {"turn": 4, "speaker": "ai", "line": "No problem. Are you waiting for the bus?"},
            {"turn": 5, "speaker": "user", "line": "Yes, the bus comes at 3:40."},
            {"turn": 6, "speaker": "ai", "line": "You have ten minutes left."},
        ]
    },
    {
        "topic": "Environment", "level": "Beginner", "title": "Simple Recycling",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Where should I put this plastic bottle?"},
            {"turn": 2, "speaker": "user", "line": "You should put it in the recycling bin."},
            {"turn": 3, "speaker": "ai", "line": "Is that the blue bin or the green bin?"},
            {"turn": 4, "speaker": "user", "line": "It is the blue bin. The green one is for glass."},
            {"turn": 5, "speaker": "ai", "line": "Okay, thank you for helping me."},
            {"turn": 6, "speaker": "user", "line": "You're welcome. We need to keep the park clean."},
        ]
    },
    {
        "topic": "Technology", "level": "Advanced", "title": "Data Privacy Concerns",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I've been reading about how companies use our personal data. It is quite alarming."},
            {"turn": 2, "speaker": "user", "line": "It truly is. We often trade our privacy for convenience without reading the fine print."},
            {"turn": 3, "speaker": "ai", "line": "Exactly. Targeted advertising is one thing, but the potential for surveillance is a much deeper issue."},
            {"turn": 4, "speaker": "user", "line": "I believe strict regulations like GDPR are necessary globally to curb this exploitation."},
            {"turn": 5, "speaker": "ai", "line": "However, technology evolves faster than legislation. Can laws really keep up?"},
            {"turn": 6, "speaker": "user", "line": "That is the challenge. We need a proactive ethical framework in tech development, not just reactive laws."},
        ]
    },
    {
        "topic": "Education", "level": "Advanced", "title": "The Future of Online Learning",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Do you think traditional universities will become obsolete with the rise of online learning platforms?"},
            {"turn": 2, "speaker": "user", "line": "I don't think they will vanish, but they must evolve. The campus experience offers social benefits that Zoom cannot replicate."},
            {"turn": 3, "speaker": "ai", "line": "That's a valid point. Networking and soft skills are often developed outside the classroom."},
            {"turn": 4, "speaker": "user", "line": "However, the democratization of knowledge through online courses is undeniable. It makes education accessible to millions."},
            {"turn": 5, "speaker": "ai", "line": "Perhaps a hybrid model is the future? Combining the flexibility of digital content with on-site collaboration."},
            {"turn": 6, "speaker": "user", "line": "I agree. That would offer the best of both worlds, prioritizing both accessibility and human connection."},
        ]
    },
    {
        "topic": "Environment", "level": "Advanced", "title": "Renewable Energy Transition",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "The transition to 100% renewable energy seems daunting. Do you think it is achievable by 2050?"},
            {"turn": 2, "speaker": "user", "line": "It is scientifically possible, but the political will and economic incentives are currently lagging behind."},
            {"turn": 3, "speaker": "ai", "line": "The storage problem is a major hurdle. Solar and wind are intermittent sources."},
            {"turn": 4, "speaker": "user", "line": "True, but advancements in battery technology and hydrogen fuel are moving rapidly. We need to invest heavily there."},
            {"turn": 5, "speaker": "ai", "line": "There is also the issue of infrastructure. Our current power grids are not designed for decentralized energy."},
            {"turn": 6, "speaker": "user", "line": "Updating the grid is a massive infrastructure project, but it creates jobs and ensures long-term energy security."},
        ]
    },
    {
        "topic": "Work", "level": "Advanced", "title": "Leadership Styles",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I've worked under both micromanagers and laissez-faire leaders. The difference in team morale is night and day."},
            {"turn": 2, "speaker": "user", "line": "Absolutely. Micromanagement kills creativity and trust, whereas autonomy empowers employees to take ownership."},
            {"turn": 3, "speaker": "ai", "line": "However, total hands-off leadership can sometimes lead to a lack of direction and accountability."},
            {"turn": 4, "speaker": "user", "line": "I believe the best approach is situational leadership—adapting your style based on the team's experience and the project's urgency."},
            {"turn": 5, "speaker": "ai", "line": "That requires a lot of emotional intelligence from the manager."},
            {"turn": 6, "speaker": "user", "line": "It does. Leadership is fundamentally about people, not just processes."},
        ]
    },
    {
        "topic": "Education", "level": "Beginner", "title": "My Favorite Subject",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "What is your favorite subject at school?"},
            {"turn": 2, "speaker": "user", "line": "I really like History."},
            {"turn": 3, "speaker": "ai", "line": "Why do you like it?"},
            {"turn": 4, "speaker": "user", "line": "Because I like learning about the past. It is interesting."},
            {"turn": 5, "speaker": "ai", "line": "I prefer Math. I am good with numbers."},
            {"turn": 6, "speaker": "user", "line": "Math is too hard for me!"},
        ]
    },
    {
        "topic": "Education", "level": "Intermediate", "title": "Preparing for an Exam",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hey, have you started studying for the finals yet?"},
            {"turn": 2, "speaker": "user", "line": "I've started reviewing my notes, but I'm still feeling pretty nervous."},
            {"turn": 3, "speaker": "ai", "line": "Me too. There is so much material to cover."},
            {"turn": 4, "speaker": "user", "line": "Do you want to study together at the library tomorrow?"},
            {"turn": 5, "speaker": "ai", "line": "That sounds like a great plan. We can quiz each other."},
            {"turn": 6, "speaker": "user", "line": "Perfect. Let's meet there at 10 AM."},
        ]
    },
    {
        "topic": "Technology", "level": "Beginner", "title": "Buying a New Phone",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Can I help you find anything?"},
            {"turn": 2, "speaker": "user", "line": "Yes, I am looking for a new phone."},
            {"turn": 3, "speaker": "ai", "line": "Do you want an iPhone or an Android?"},
            {"turn": 4, "speaker": "user", "line": "I prefer iPhone. I have one now."},
            {"turn": 5, "speaker": "ai", "line": "Okay. This is the new model. It has a great camera."},
            {"turn": 6, "speaker": "user", "line": "It looks nice. How much is it?"},
        ]
    },
    {
        "topic": "Technology", "level": "Intermediate", "title": "Calling IT Support", 
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "IT Support, Sarah speaking. How can I help?"},
            {"turn": 2, "speaker": "user", "line": "Hi Sarah. My computer is running very slow and then it freezes."},
            {"turn": 3, "speaker": "ai", "line": "I see. Have you tried turning it off and on again?"},
            {"turn": 4, "speaker": "user", "line": "Yes, I did that twice, but the problem is still there."},
            {"turn": 5, "speaker": "ai", "line": "Okay. I might need to access your screen remotely to check the software."},
            {"turn": 6, "speaker": "user", "line": "Sure. Just let me know what I need to do."},
        ]
    },
    {
        "topic": "Technology", "level": "Advanced", "title": "AI and Future of Work",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Do you think Artificial Intelligence will eventually replace creative jobs?"},
            {"turn": 2, "speaker": "user", "line": "It's a contentious issue. While AI can mimic styles, I believe it lacks the genuine human emotional depth required for true art."},
            {"turn": 3, "speaker": "ai", "line": "But look at how fast it's learning. It can already write poetry and paint pictures."},
            {"turn": 4, "speaker": "user", "line": "True, but it's derivative. It synthesizes existing data rather than generating novel concepts from lived experience."},
            {"turn": 5, "speaker": "ai", "line": "So you see it as a tool rather than a replacement?"},
            {"turn": 6, "speaker": "user", "line": "Precisely. It will augment human creativity, forcing us to focus on higher-level conceptual work."},
        ]
    },
    {
        "topic": "Environment", "level": "Intermediate", "title": "Reducing Plastic Waste",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I'm trying to use less plastic at home."},
            {"turn": 2, "speaker": "user", "line": "That's a good idea. What changes have you made?"},
            {"turn": 3, "speaker": "ai", "line": "I stopped buying bottled water. I use a reusable bottle now."},
            {"turn": 4, "speaker": "user", "line": "I should do that too. I also bring my own bags to the grocery store."},
            {"turn": 5, "speaker": "ai", "line": "Every little bit helps to protect the ocean."},
            {"turn": 6, "speaker": "user", "line": "Exactly. We all need to do our part."},
        ]
    },
    {
        "topic": "Food", "level": "Beginner", "title": "Ordering a Coffee",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hello! What can I get for you today?"},
            {"turn": 2, "speaker": "user", "line": "Hello. I want a coffee, please."},
            {"turn": 3, "speaker": "ai", "line": "Okay. A small or a large coffee?"},
            {"turn": 4, "speaker": "user", "line": "A small one, please."},
            {"turn": 5, "speaker": "ai", "line": "Do you want milk or sugar?"},
            {"turn": 6, "speaker": "user", "line": "Yes, milk and one sugar, please."},
        ]
    },
    {
        "topic": "Food", "level": "Beginner", "title": "Asking for the Bill",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Did you enjoy your meal?"},
            {"turn": 2, "speaker": "user", "line": "Yes, it was very good."},
            {"turn": 3, "speaker": "ai", "line": "Great! Can I get you anything else?"},
            {"turn": 4, "speaker": "user", "line": "No, thank you. Can I have the bill, please?"},
            {"turn": 5, "speaker": "ai", "line": "Of course. Here it is."},
            {"turn": 6, "speaker": "user", "line": "Thank you. Do you accept credit cards?"},
            {"turn": 7, "speaker": "ai", "line": "Yes, we do."},
            {"turn": 8, "speaker": "user", "line": "Okay. Here is my card."},
        ]
    },
    {
        "topic": "Food", "level": "Beginner", "title": "At the Grocery Store",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hello, can I help you?"},
            {"turn": 2, "speaker": "user", "line": "Yes, please. I need some apples."},
            {"turn": 3, "speaker": "ai", "line": "Okay, how many apples do you want?"},
            {"turn": 4, "speaker": "user", "line": " I want six apples, please."},
            {"turn": 5, "speaker": "ai", "line": "Here you are. Anything else?"},
            {"turn": 6, "speaker": "user", "line": "Yes, I also need some bread."},
            {"turn": 7, "speaker": "ai", "line": "The bread is over there, next to the milk."},
            {"turn": 8, "speaker": "user", "line": "Thank you. How much is it for the apples?"},
            {"turn": 9, "speaker": "ai", "line": "That will be four dollars."},
        ]
    },
    {
        "topic": "Food", "level": "Beginner", "title": "Making a Reservation",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Good evening, The Corner Restaurant. How can I help?"},
            {"turn": 2, "speaker": "user", "line": "Hello, I would like to make a reservation."},
            {"turn": 3, "speaker": "ai", "line": "For how many people?"},
            {"turn": 4, "speaker": "user", "line": " For two people, please."},
            {"turn": 5, "speaker": "ai", "line": "And for what time?"},
            {"turn": 6, "speaker": "user", "line": "For 7 PM tonight."},
            {"turn": 7, "speaker": "ai", "line": "Let me see. Yes, we have a table for two at 7 PM."},
            {"turn": 8, "speaker": "user", "line": "Great. Thank you."},
            {"turn": 9, "speaker": "ai", "line": "May I have your name, please?"},
            {"turn": 10, "speaker": "user", "line": " My name is Jenny."},
            {"turn": 11, "speaker": "ai", "line": " Okay, Jenny. Your table is booked. We'll see you at 7"},
        ]
    },
    {
        "topic": "Food", "level": "Intermediate", "title": "Discussing Restaurant Choices",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I'm getting hungry. What are you in the mood for tonight?"},
            {"turn": 2, "speaker": "user", "line": "I'm not sure. I had Italian yesterday, so maybe something different."},
            {"turn": 3, "speaker": "ai", "line": "How about that new Thai restaurant downtown? I've heard good things about it."},
            {"turn": 4, "speaker": "user", "line": "Thai sounds interesting. Is it very spicy?"},
            {"turn": 5, "speaker": "ai", "line": "They can adjust the spice level. Their green curry is supposed to be amazing."},
            {"turn": 6, "speaker": "user", "line": "Okay, I'm willing to give it a try. Should we make a reservation?"},
        ]
    },
    {
        "topic": "Food", "level": "Advanced", "title": "Debating Food Ethics",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I've been reading a lot about the ethical implications of our food choices lately. It's quite thought-provoking."},
            {"turn": 2, "speaker": "user", "line": "I agree. I've been trying to lean more towards plant-based options, mainly due to concerns about factory farming."},
            {"turn": 3, "speaker": "ai", "line": "That's a commendable approach. My main struggle is with sustainability."},
            {"turn": 4, "speaker": "user", "line": "That's true, the issue is multifaceted. For instance, almond milk requires a staggering amount of water."},
            {"turn": 5, "speaker": "ai", "line": "Precisely. It feels like a trade-off at every turn."},
            {"turn": 6, "speaker": "user", "line": "Absolutely. It raises the question of whether conscious consumerism is a privilege."},
        ]
    },
    {
        "topic": "Travel", "level": "Beginner", "title": "Buying a Train Ticket",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Next, please. How can I help you?"},
            {"turn": 2, "speaker": "user", "line": "Hi, I would like a ticket to Oxford, please."},
            {"turn": 3, "speaker": "ai", "line": "Single or return?"},
            {"turn": 4, "speaker": "user", "line": "A return ticket, please. Coming back today."},
            {"turn": 5, "speaker": "ai", "line": "That will be twenty pounds. The next train is in 10 minutes on Platform 5."},
            {"turn": 6, "speaker": "user", "line": "Thank you very much."},
        ]
    },
    {
        "topic": "Travel", "level": "Beginner", "title": "Asking for Directions",
        "dialogues": [
            {"turn": 1, "speaker": "user", "line": "Excuse me. Where is the nearest bank?"},
            {"turn": 2, "speaker": "ai", "line": "The bank? Go straight on this street. Then, turn left."},
            {"turn": 3, "speaker": "user", "line": "Go straight and turn left?"},
            {"turn": 4, "speaker": "ai", "line": "Yes. The bank is on the corner."},
            {"turn": 5, "speaker": "user", "line": "Okay. Thank you for your help."},
            {"turn": 6, "speaker": "ai", "line": "You're welcome."},
        ]
    },
    {
        "topic": "Travel", "level": "Beginner", "title": "At the Airport Check-in",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hello. Where are you flying to today?"},
            {"turn": 2, "speaker": "user", "line": "I am flying to London."},
            {"turn": 3, "speaker": "ai", "line": "May I see your passport and ticket, please?"},
            {"turn": 4, "speaker": "user", "line": "Yes, here they are."},
            {"turn": 5, "speaker": "ai", "line": "Thank you. Are you checking any bags?"},
            {"turn": 6, "speaker": "user", "line": "Just this one bag."},
            {"turn": 7, "speaker": "ai", "line": "Okay. Would you like a window seat or an aisle seat?"},
            {"turn": 8, "speaker": "user", "line": "A window seat, please."},
            {"turn": 9, "speaker": "ai", "line": "Alright. Here is your boarding pass. Your gate is B12."},
            {"turn": 10, "speaker": "user", "line": "Thank you."},
        ]
    },
    {
        "topic": "Travel", "level": "Beginner", "title": "In a taxi",
        "dialogues": [
            {"turn": 1, "speaker": "user", "line": "Hello. To the airport, please."},
            {"turn": 2, "speaker": "ai", "line": "The airport? Sure. Hop in."},
            {"turn": 3, "speaker": "user", "line": "How long does it take to get there?"},
            {"turn": 4, "speaker": "ai", "line": " It takes about 30 minutes right now."},
            {"turn": 5, "speaker": "user", "line": "Okay, that's fine."},
            {"turn": 6, "speaker": "ai", "line": "We are here."},
            {"turn": 7, "speaker": "user", "line": "How much is the fare?"},
            {"turn": 8, "speaker": "ai", "line": "It's twenty-five dollars."},
            {"turn": 9, "speaker": "user", "line": "Here is thirty. You can keep the change."},
            {"turn": 10, "speaker": "ai", "line": "Thank you! Have a nice flight."},
        ]
    },
    {
        "topic": "Travel", "level": "Intermediate", "title": "Asking for Recommendations",
        "dialogues": [
            {"turn": 1, "speaker": "user", "line": " Excuse me, I'm visiting for a few days. Could you recommend something to see?"},
            {"turn": 2, "speaker": "ai", "line": "Of course. Are you interested in the main tourist attractions, or something more local?"},
            {"turn": 3, "speaker": "user", "line": "I'd prefer something a bit less touristy if possible."},
            {"turn": 4, "speaker": "ai", "line": "In that case, you should definitely check out the old market district. It's full of character."},
            {"turn": 5, "speaker": "user", "line": "Oh, that sounds perfect. Is it easy to get to from here?"},
            {"turn": 6, "speaker": "ai", "line": "Yes, you can take the number 12 bus. It stops right at the entrance."},
            {"turn": 7, "speaker": "user", "line": "Thanks for the tip! I appreciate it."},
            {"turn": 8, "speaker": "ai", "line": "No problem. Enjoy your visit!"},
        ]
    },
    {
        "topic": "Travel", "level": "Advanced", "title": "The Impact of Overtourism",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": " I was just looking at photos of Venice, and it reminded me of the problem of overtourism."},
            {"turn": 2, "speaker": "user", "line": " It's a double-edged sword, isn't it? Tourism drives the economy, but it can have a detrimental impact on local culture and infrastructure."},
            {"turn": 3, "speaker": "ai", "line": "Exactly. The very things that make a place attractive are at risk of being destroyed by the sheer volume of visitors."},
            {"turn": 4, "speaker": "user", "line": "I believe part of the solution lies in promoting more sustainable tourism practices."},
            {"turn": 5, "speaker": "ai", "line": "Such as what? Limiting the number of daily visitors or imposing a tourist tax?"},
            {"turn": 6, "speaker": "user", "line": " Both are viable options. I also think encouraging travel to off-the-beaten-path destinations could help distribute the load."},
            {"turn": 7, "speaker": "ai", "line": "That's a good point. It would require a shift in marketing, moving the focus away from just the iconic landmarks."},
            {"turn": 8, "speaker": "user", "line": "It's a complex issue with no easy answers, but something definitely needs to be done to preserve these places for future generations."},
        ]
    },
    {
        "topic": "Shopping", "level": "Beginner", "title": "Buying a T-shirt",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hello! Can I help you?"},
            {"turn": 2, "speaker": "user", "line": "Yes, please. I like this T-shirt. How much is it?"},
            {"turn": 3, "speaker": "ai", "line": "It's fifteen dollars."},
            {"turn": 4, "speaker": "user", "line": "Okay. Do you have it in blue?"},
            {"turn": 5, "speaker": "ai", "line": " Yes, we do. What size do you need?"},
            {"turn": 6, "speaker": "user", "line": " I need a medium size."},
            {"turn": 7, "speaker": "ai", "line": "Here is a medium in blue. You can try it on over there."},
            {"turn": 8, "speaker": "user", "line": "Thank you. I will take it."},
        ]
    },
    {
        "topic": "Shopping", "level": "Intermediate", "title": "Returning a Faulty Item",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hello, how can I help you?"},
            {"turn": 2, "speaker": "user", "line": "Hi, I'd like to return these headphones. I bought them here yesterday."},
            {"turn": 3, "speaker": "ai", "line": "Is there a problem with them?"},
            {"turn": 4, "speaker": "user", "line": "Yes, they're faulty. The sound only comes out of one side."},
            {"turn": 5, "speaker": "ai", "line": "I'm sorry to hear that. Do you have the receipt?"},
            {"turn": 6, "speaker": "user", "line": "Yes, here it is."},
            {"turn": 7, "speaker": "ai", "line": "Thank you. Would you like to exchange them for a new pair, or would you prefer a full refund."},
            {"turn": 8, "speaker": "user", "line": " I'd like a refund, please."},
            {"turn": 9, "speaker": "ai", "line": "Certainly. I'll process that for you right away."},
        ]
    },
    {
        "topic": "Shopping", "level": "Advanced", "title": "Discussing Fast Fashion",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I walked past a fast-fashion store today, and the sheer amount of new clothing was staggering."},
            {"turn": 2, "speaker": "user", "line": " It's a vicious cycle. These brands have conditioned us to expect new trends every few weeks."},
            {"turn": 3, "speaker": "ai", "line": " The environmental cost is enormous, not to mention the ethical concerns regarding labor practices."},
            {"turn": 4, "speaker": "user", "line": "Absolutely. The pressure to produce clothes so cheaply inevitably leads to exploitation in the supply chain."},
            {"turn": 5, "speaker": "ai", "line": " I've been trying to break the habit, investing in quality pieces that last longer instead of buying disposable items."},
            {"turn": 6, "speaker": "user", "line": "That's the way to go. It requires a mindset shift, from viewing clothes as temporary to seeing them as long-term investments."},
            {"turn": 7, "speaker": "ai", "line": "It's challenging, though. The allure of a five-dollar T-shirt is hard to resist for many people."},
            {"turn": 8, "speaker": "user", "line": "True, which brings us back to the issue of accessibility and privilege. It's a systemic problem."},
        ]
    },
    {
        "topic": "Daily Life", "level": "Beginner", "title": "Introducing Yourself",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hi! My name is Alex. What's your name?"},
            {"turn": 2, "speaker": "user", "line": "Hello, Alex. My name is Jenny."},
            {"turn": 3, "speaker": "ai", "line": "It's nice to meet you, Jenny."},
            {"turn": 4, "speaker": "user", "line": " Nice to meet you too."},
            {"turn": 5, "speaker": "ai", "line": " Where are you from, Jenny?"},
            {"turn": 6, "speaker": "user", "line": "I am from Vietnam. And you?"},
            {"turn": 7, "speaker": "ai", "line": " I am from the United States."},
            {"turn": 8, "speaker": "user", "line": "Oh, that's interesting!"},
        ]
    },
    {
        "topic": "Daily Life", "level": "Beginner", "title": "Talking About Your Day",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hi, Jenny. How was your day?"},
            {"turn": 2, "speaker": "user", "line": " It was good, thank you. A little busy."},
            {"turn": 3, "speaker": "ai", "line": "Oh? What did you do today?"},
            {"turn": 4, "speaker": "user", "line": " I had a lot of work at the office."},
            {"turn": 5, "speaker": "ai", "line": " I see. Are you tired now?"},
            {"turn": 6, "speaker": "user", "line": "Yes, a little. I want to go home."},
            {"turn": 7, "speaker": "ai", "line": " Okay. Have a good evening!"},
            {"turn": 8, "speaker": "user", "line": "You too. Goodbye."},
        ]
    },
    {
        "topic": "Daily Life", "level": "Intermediate", "title": "Making Weekend Plans",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "So, what are you up to this weekend?"},
            {"turn": 2, "speaker": "user", "line": " I don't have any plans yet. Do you feel like doing something?"},
            {"turn": 3, "speaker": "ai", "line": "Definitely. How about we go for a hike on Saturday morning? The weather is supposed to be nice "},
            {"turn": 4, "speaker": "user", "line": "A hike sounds great, but I might be busy in the morning. Could we go in the afternoon instead?"},
            {"turn": 5, "speaker": "ai", "line": "Sure, the afternoon works for me too. We could grab dinner afterwards."},
            {"turn": 6, "speaker": "user", "line": "Perfect! Let's plan on that."},
            {"turn": 7, "speaker": "ai", "line": "Sounds good. I'm looking forward to it."},
        ]
    },
    {
        "topic": "Daily Life", "level": "Advanced", "title": "Work-Life Balance and Burnout",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "It seems like everyone is talking about burnout these days."},
            {"turn": 2, "speaker": "user", "line": "I'm not surprised. The hustle culture that was glorified a few years ago is now showing its detrimental effects."},
            {"turn": 3, "speaker": "ai", "line": "I agree. The expectation to be on 24/7 is simply unsustainable. Achieving a genuine work-life balance is a real challenge."},
            {"turn": 4, "speaker": "user", "line": "I've found that I have to be really disciplined about setting boundaries, like not checking work emails after 6 PM."},
            {"turn": 5, "speaker": "ai", "line": " That's a crucial skill. It's so easy to let work bleed into your personal time, especially with remote work becoming more common."},
            {"turn": 6, "speaker": "user", "line": "Exactly. It requires a conscious effort to disconnect and prioritize your well-being."},
            {"turn": 7, "speaker": "ai", "line": "It's a cultural shift that needs to happen, where companies value sustainable productivity over constant availability."},
            {"turn": 8, "speaker": "user", "line": "Well said. Rest is not a luxury; it's a necessity for good work."},
        ]
    },
    {
        "topic": "Health", "level": "Beginner", "title": "Making a Doctor's Appointment",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "City Clinic, how may I help you?"},
            {"turn": 2, "speaker": "user", "line": " Hello, I'd like to make an appointment to see a doctor."},
            {"turn": 3, "speaker": "ai", "line": "Of course. What is your name, please?"},
            {"turn": 4, "speaker": "user", "line": "  My name is Jenny."},
            {"turn": 5, "speaker": "ai", "line": "Okay, Ms. Jenny. When would you like to come in?"},
            {"turn": 6, "speaker": "user", "line": "Is tomorrow morning possible?"},
            {"turn": 7, "speaker": "ai", "line": "Let me check. Yes, we have a spot at 10 AM. Is that okay?"},
            {"turn": 8, "speaker": "user", "line": "Yes, 10 AM is perfect."},
            {"turn": 9, "speaker": "ai", "line": "Alright. We will see you tomorrow at 10 AM. Is that okay?"},
            {"turn": 10, "speaker": "user", "line": "Thank you. Goodbye."},
        ]
    },
    {
        "topic": "Health", "level": "Intermediate", "title": "Describing Symptoms",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Good morning. What seems to be the problem?"},
            {"turn": 2, "speaker": "user", "line": "I've been feeling unwell for the past couple of days."},
            {"turn": 3, "speaker": "ai", "line": "Can you describe your symptoms?"},
            {"turn": 4, "speaker": "user", "line": "I have a sore throat and a runny nose. I also had a slight fever last night."},
            {"turn": 5, "speaker": "ai", "line": "I see. Do you have a headache or any body aches?"},
            {"turn": 6, "speaker": "user", "line": "Yes, I have a bad headache."},
        ]
    },
    {
        "topic": "Health", "level": "Advanced", "title": "Debating Wellness Trends",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Have you noticed how the wellness industry has exploded? There's a new 'superfood' every week."},
            {"turn": 2, "speaker": "user", "line": "I have, and I'm quite skeptical of most of it. A lot seems to be based on pseudoscience."},
            {"turn": 3, "speaker": "ai", "line": "My thoughts exactly. I always try to look for evidence-based claims."},
            {"turn": 4, "speaker": "user", "line": "And the products are usually incredibly expensive. It preys on people's desires for a quick fix."},
            {"turn": 5, "speaker": "ai", "line": "You can't discount the placebo effect, though. If someone believes it helps, is there harm?"},
            {"turn": 6, "speaker": "user", "line": "I'd argue the harm comes from diverting people away from scientifically proven medical advice."},
        ]
    },
    {
        "topic": "Hobbies", "level": "Beginner", "title": "Talking About Hobbies",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "What do you like to do in your free time, Jenny?"},
            {"turn": 2, "speaker": "user", "line": "I like reading books."},
            {"turn": 3, "speaker": "ai", "line": "That's nice. What kind of books do you read?"},
            {"turn": 4, "speaker": "user", "line": "I like story books. What about you? What are your hobbies?"},
            {"turn": 5, "speaker": "ai", "line": "I like watching movies."},
            {"turn": 6, "speaker": "user", "line": "Me too! I like comedy movies."},
            {"turn": 7, "speaker": "ai", "line": "They are very fun."},
            {"turn": 8, "speaker": "user", "line": "Yes, they are."},
        ]
    },
    {
        "topic": "Hobbies", "level": "Intermediate", "title": "Discussing a Movie",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Did you see the new sci-fi movie that just came out?"},
            {"turn": 2, "speaker": "user", "line": "Yes, I watched it last night! What did you think of it?"},
            {"turn": 3, "speaker": "ai", "line": "I thought it was incredible. The special effects were amazing."},
            {"turn": 4, "speaker": "user", "line": " I agree, but I found the plot a little confusing at times."},
            {"turn": 5, "speaker": "ai", "line": "Really? I thought it was clever. And the acting was superb."},
            {"turn": 6, "speaker": "user", "line": "The acting was great, for sure. I just wasn't a fan of the ending."},
            {"turn": 7, "speaker": "ai", "line": " I can see that. It was a bit unexpected. Would you recommend it to others?"},
            {"turn": 8, "speaker": "user", "line": "Yes, I think it's still worth watching for the visuals alone."},
        ]
    },
    {
        "topic": "Hobbies", "level": "Advanced", "title": "Analyzing a Controversial Film",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": " I finally watched that new psychological thriller everyone's been debating."},
            {"turn": 2, "speaker": "user", "line": "Oh, the one with the ambiguous ending? I'd love to hear your take on it."},
            {"turn": 3, "speaker": "ai", "line": "I found it brilliant, but frustrating. The symbolism was potent, but the lack of closure left me feeling unsatisfied."},
            {"turn": 4, "speaker": "user", "line": " I felt the same way initially, but the more I thought about it, the more I appreciated how it's open to interpretation."},
            {"turn": 5, "speaker": "ai", "line": " I can see that. It certainly forces the audience to engage with the material on a deeper level. What did you think of the main character's development?"},
            {"turn": 6, "speaker": "user", "line": " I thought it was masterfully done. His slow descent into paranoia felt incredibly authentic, albeit disturbing."},
            {"turn": 7, "speaker": "ai", "line": "Agreed. Despite my issues with the ending, I can't deny the film's thematic depth and technical craftsmanship."},
            {"turn": 8, "speaker": "user", "line": "It's definitely a film that will stick with me for a while. It's not often a movie sparks so much discussion."},
        ]
    },
    {
        "topic": "Family", "level": "Beginner", "title": "Talking About Your Family",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Do you have any brothers or sisters?"},
            {"turn": 2, "speaker": "user", "line": "Yes, I have one brother."},
            {"turn": 3, "speaker": "ai", "line": "Oh, really? What is his name?"},
            {"turn": 4, "speaker": "user", "line": "His name is Son. He is older than me."},
            {"turn": 5, "speaker": "ai", "line": "That's nice. I have one sister."},
            {"turn": 6, "speaker": "user", "line": "What does your sister do?"},
            {"turn": 7, "speaker": "ai", "line": "She is a student."},
            {"turn": 8, "speaker": "user", "line": "I see."},
        ]
    },
    {
        "topic": "Family", "level": "Intermediate", "title": "Describing Personalities",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "You mentioned you have an older brother. What's he like?"},
            {"turn": 2, "speaker": "user", "line": "He's very different from me. He's really outgoing and loves talking to people."},
            {"turn": 3, "speaker": "ai", "line": "And you're a bit more reserved?"},
            {"turn": 4, "speaker": "user", "line": "Yes, I'm quite shy until I get to know someone."},
            {"turn": 5, "speaker": "ai", "line": "My sister is the same. But she has a great sense of humor."},
            {"turn": 6, "speaker": "user", "line": "My brother is funny too. He's also very hard-working."},
            {"turn": 7, "speaker": "ai", "line": "  It sounds like you two get along well."},
            {"turn": 8, "speaker": "user", "line": "Yes, most of the time!"},
        ]
    },
    {
        "topic": "Family", "level": "Advanced", "title": "Generational Differences",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "I was talking to my grandfather yesterday, and the generational gap in our perspectives on work is astounding."},
            {"turn": 2, "speaker": "user", "line": "Tell me about it. My parents' generation often equates long hours with dedication, which is a concept my peers tend to reject."},
            {"turn": 3, "speaker": "ai", "line": "Exactly. They come from a different frame of reference. For them, stability was the ultimate career goal."},
            {"turn": 4, "speaker": "user", "line": "Whereas for us, fulfillment and flexibility are often prioritized over a 'job for life'."},
            {"turn": 5, "speaker": "ai", "line": " It's also fascinating how technology has shaped our worldviews. We're digital natives; it's integrated into our very existence."},
            {"turn": 6, "speaker": "user", "line": "That's a huge factor. The way we communicate, learn, and even form relationships is fundamentally different."},
            {"turn": 7, "speaker": "ai", "line": "Do you think these gaps are widening or shrinking?"},
            {"turn": 8, "speaker": "user", "line": " That's a tough question. In some ways, shared global culture brings us closer, but in others, our core values seem to be diverging."},
        ]
    },
    {
        "topic": "Work", "level": "Beginner", "title": "Asking About Jobs",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "What do you do for work?"},
            {"turn": 2, "speaker": "user", "line": "I am a teacher."},
            {"turn": 3, "speaker": "ai", "line": "A teacher? That's a great job."},
            {"turn": 4, "speaker": "user", "line": " Thank you. What about you? What is your job?"},
            {"turn": 5, "speaker": "ai", "line": "I work in an office. I am a manager."},
            {"turn": 6, "speaker": "user", "line": " Do you like your job?"},
            {"turn": 7, "speaker": "ai", "line": "Yes, I do. It's very interesting."},
            {"turn": 8, "speaker": "user", "line": "That's good to hear."},
        ]
    },
    {
        "topic": "Work", "level": "Intermediate", "title": "Talking About a Project",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "How's that new project going?"},
            {"turn": 2, "speaker": "user", "line": "It's a bit stressful, to be honest. The deadline is approaching quickly."},
            {"turn": 3, "speaker": "ai", "line": "I can imagine. Is there anything I can do to help?"},
            {"turn": 4, "speaker": "user", "line": "Thanks for offering. We're trying to figure out a bug in the code."},
            {"turn": 5, "speaker": "ai", "line": "I have some experience with that. Maybe a fresh pair of eyes could help?"},
            {"turn": 6, "speaker": "user", "line": "That would be amazing. Do you have some time this afternoon?"},
            {"turn": 7, "speaker": "ai", "line": " Yes, I'm free after 3 PM. Let's tackle it together."},
            {"turn": 8, "speaker": "user", "line": "Thank you so much. I really appreciate it."},
        ]
    },
    {
        "topic": "Work", "level": "Advanced", "title": "Handling a Workplace Disagreement",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": " I need some advice. I had a significant disagreement with a colleague today over the direction of our project."},
            {"turn": 2, "speaker": "user", "line": "That sounds challenging. Was it a constructive discussion, or did it get heated?"},
            {"turn": 3, "speaker": "ai", "line": "It remained professional, but there was palpable tension. We're at a standstill."},
            {"turn": 4, "speaker": "user", "line": "In these situations, I find it's best to focus on the objective rather than individual opinions. Is there any common ground you both share?"},
            {"turn": 5, "speaker": "ai", "line": "We both want the project to succeed, of course. We just have fundamentally different ideas on how to get there."},
            {"turn": 6, "speaker": "user", "line": "Perhaps it would be helpful to bring in a neutral third party, like a manager, to mediate and provide a fresh perspective."},
            {"turn": 7, "speaker": "ai", "line": "I was considering that. I don't want this to escalate and affect the team dynamic."},
            {"turn": 8, "speaker": "user", "line": "Exactly. Addressing it proactively and diplomatically is the best approach."},
        ]
    },
    {
        "topic": "Weather", "level": "Beginner", "title": "Talking About the Weather",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "It's a beautiful day today, isn't it?"},
            {"turn": 2, "speaker": "user", "line": "Yes, it is. It's very sunny."},
            {"turn": 3, "speaker": "ai", "line": "I love sunny weather. It's perfect for a walk."},
            {"turn": 4, "speaker": "user", "line": "Me too. I don't like the rain."},
            {"turn": 5, "speaker": "ai", "line": "What is the weather like in your country?"},
            {"turn": 6, "speaker": "user", "line": "It is very hot in the summer."},
            {"turn": 7, "speaker": "ai", "line": "I see. I want to visit your country one day."},
            {"turn": 8, "speaker": "user", "line": "You should! It's a great place."},
        ]
    },
    {
        "topic": "Weather", "level": "Intermediate", "title": "Complaining About the Rain",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": " Look at it out there. It's pouring!"},
            {"turn": 2, "speaker": "user", "line": "I know. I can't stand this rainy weather."},
            {"turn": 3, "speaker": "ai", "line": "Me neither. I had plans to go to the park."},
            {"turn": 4, "speaker": "user", "line": "Oh no, so your plans are ruined. I was going to go for a run."},
            {"turn": 5, "speaker": "ai", "line": " Now we're both stuck inside. What do you feel like doing instead?"},
            {"turn": 6, "speaker": "user", "line": " I guess we could watch a movie."},
            {"turn": 7, "speaker": "ai", "line": "  That's a good idea. Hopefully the weather clears up by tomorrow."},
            {"turn": 8, "speaker": "user", "line": "I hope so!"},
        ]
    },
    {
        "topic": "Weather", "level": "Advanced", "title": "Discussing Climate Change",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "These heatwaves are becoming more frequent and intense. It's hard to ignore the signs of climate change."},
            {"turn": 2, "speaker": "user", "line": " I agree completely. The frequency of extreme weather events globally is alarming."},
            {"turn": 3, "speaker": "ai", "line": "I've been trying to reduce my carbon footprint, but it feels like a drop in the ocean."},
            {"turn": 4, "speaker": "user", "line": "I know what you mean. Individual actions are important, but we need large-scale, systemic change from governments and corporations."},
            {"turn": 5, "speaker": "ai", "line": " The transition to renewable energy seems painfully slow, given the urgency of the situation."},
            {"turn": 6, "speaker": "user", "line": "It is. There are so many economic and political interests at play that hinder progress."},
            {"turn": 7, "speaker": "ai", "line": "My biggest fear is that we'll reach a tipping point where the damage is irreversible."},
            {"turn": 8, "speaker": "user", "line": " It's a daunting prospect, but we have to remain hopeful and continue to advocate for change."},
        ]
    },
    {
        "topic": "Feeling", "level": "Beginner", "title": "Asking How Someone Is",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "Hi John, how are you today?"},
            {"turn": 2, "speaker": "user", "line": " I'm okay, but I'm a little tired."},
            {"turn": 3, "speaker": "ai", "line": "Oh no, why are you tired?"},
            {"turn": 4, "speaker": "user", "line": "I did not sleep well last night."},
            {"turn": 5, "speaker": "ai", "line": "I'm sorry to hear that. Do you want some coffee?"},
            {"turn": 6, "speaker": "user", "line": "Yes, please. That sounds great."},
            {"turn": 7, "speaker": "ai", "line": "Okay, I will get you a cup."},
            {"turn": 8, "speaker": "user", "line": "Thank you so much."},
        ]
    },
    {
        "topic": "Feeling", "level": "Intermediate", "title": "Giving Advice",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": "You look a bit stressed. Is everything okay?"},
            {"turn": 2, "speaker": "user", "line": "Not really. I have a huge exam next week and I feel overwhelmed."},
            {"turn": 3, "speaker": "ai", "line": " I just feel like I have so much to study."},
            {"turn": 4, "speaker": "user", "line": "My advice is to take a short break. Go for a walk and clear your head."},
            {"turn": 5, "speaker": "ai", "line": "You think so? I feel like I should be studying every minute."},
            {"turn": 6, "speaker": "user", "line": "A break will help you focus better afterwards. Also, make sure you're getting enough sleep."},
            {"turn": 7, "speaker": "ai", "line": " That's probably a good idea. Thanks for the advice."},
        ]
    },
    {
        "topic": "Feeling", "level": "Advanced", "title": "Navigating Complex Emotions",
        "dialogues": [
            {"turn": 1, "speaker": "ai", "line": " Have you ever felt completely ambivalent about a major life decision?"},
            {"turn": 2, "speaker": "user", "line": "All the time. I'm currently experiencing some cognitive dissonance about a career opportunity."},
            {"turn": 3, "speaker": "ai", "line": "I can relate. Part of you knows it's the logical choice, but another part is resisting it fiercely?"},
            {"turn": 4, "speaker": "user", "line": "That's it exactly. It's a strange feeling, being pulled in two opposite directions."},
            {"turn": 5, "speaker": "ai", "line": " I think it's just part of the human experience. It takes time to process those conflicting emotions."},
            {"turn": 6, "speaker": "user", "line": "How do you usually come to terms with it?"},
            {"turn": 7, "speaker": "ai", "line": "I try to sit with the discomfort instead of fighting it. Eventually, one path usually starts to feel slightly more right than the other."},
            {"turn": 8, "speaker": "user", "line": "That's a mindful approach. It's a testament to our emotional resilience, I suppose."},
        ]
    },
]

def seed():
    print("🌱 Bắt đầu quá trình seeding toàn bộ kịch bản...")
    scenarios_created = 0
    for scenario_data in ALL_SCENARIOS:
        try:
            scenario_info = {
                "topic": scenario_data["topic"],
                "level": scenario_data["level"],
                "title": scenario_data["title"],
            }
            dialogues = scenario_data["dialogues"]

            existing = crud_scenarios.get_scenario_by_title(supabase, scenario_info['title'])

            if existing:
                print(f"[*] Kịch bản '{scenario_info['title']}' đã tồn tại, bỏ qua.")
            else:
                print(f"[*] Đang tạo kịch bản mới: '{scenario_info['title']}'...")
                crud_scenarios.create_scenario_with_dialogues(supabase, scenario_info, dialogues)
                scenarios_created += 1
                print(f" Đã tạo thành công.")
        
        except Exception as e:
            print(f" Lỗi khi xử lý kịch bản '{scenario_data.get('title', 'N/A')}': {e}")

    print("-" * 30)
    print(f"Quá trình seeding hoàn tất. Đã tạo mới {scenarios_created} kịch bản.")

if __name__ == "__main__":
    print("  CẢNH BÁO: Script này sẽ xóa TOÀN BỘ dữ liệu kịch bản hiện có trước khi thêm dữ liệu mới.")
    print("Điều này hữu ích để đảm bảo dữ liệu sạch, nhưng sẽ làm mất mọi thay đổi bạn đã thực hiện trên Supabase.")
    user_input = input("Gõ 'yes' để xác nhận và tiếp tục: ")
    
    if user_input.lower() == 'yes':
        try:
            print("\n Đang khởi tạo lại cấu trúc database...")
            os.system(f"{sys.executable} -m fastapi_app.scripts.init_db")
            seed()
        except Exception as e:
            print(f"Đã xảy ra lỗi trong quá trình khởi tạo lại DB: {e}")
            print("Đang thử seed dữ liệu mà không khởi tạo lại...")
            seed()
    else:
        print("Đã hủy quá trình seeding.")