"""RAWI campaign API.

A campaign is built by four steps that run in order:

1. trend filter  - a plain rule check (no AI). Looks the chosen trend up in a curated,
                   dated catalogue and records why it fits and what to be careful about.
2. strategy      - who exactly the customer is, and three ways to earn their trust.
3. content       - title, concept, scene-by-scene script, caption, hashtags, posting plan.
4. review        - a brand-safety and cultural-fit check of the finished content.

With GEMINI_API_KEY set, steps 2-4 are three separate Gemini prompts. Without a key the
same pipeline runs on built-in templates, so the whole app can be demoed offline.
The response says which mode produced it and how long each step took.
"""
import os
import time
from typing import Annotated, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, StringConstraints

load_dotenv()

MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

app = FastAPI(title='RAWI Campaign API', version='0.2.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

Lang = Literal['ar', 'en']

# --------------------------------------------------------------------------- trends
# These are a curated sample, not live social-media data. "moment" entries are calendar
# facts, "format" entries are video styles. Nothing here claims a popularity figure.
TRENDS_AS_OF = '2026-11-08'
TRENDS = [
    {'id': 'winter-mornings', 'kind': 'moment',
     'name': {'en': 'Winter mornings', 'ar': 'صباحات الشتاء'},
     'why': {'en': 'Cool weather brings back warm drinks, comfort food and cozy things.',
             'ar': 'الجو البارد يرجّع المشروبات الدافئة والأكل المريح والأشياء الدافئة.'},
     'caution': {'en': 'A seasonal moment, not a live trend. Do not say it is trending today.',
                 'ar': 'موسم وليس ترند لحظي. لا تقل إنه رائج اليوم.'}},
    {'id': 'white-friday', 'kind': 'moment',
     'name': {'en': 'White Friday sales (27 Nov 2026)', 'ar': 'الجمعة البيضاء (27 نوفمبر 2026)'},
     'why': {'en': 'Shoppers expect offers and compare prices during this week.',
             'ar': 'الناس تتوقع عروض وتقارن الأسعار في هذا الأسبوع.'},
     'caution': {'en': 'Only advertise a real discount you can honor. Fake offers destroy trust.',
                 'ar': 'اعلن عن خصم حقيقي تقدر تلتزم به فقط. العروض الوهمية تضيّع الثقة.'}},
    {'id': 'founding-day', 'kind': 'moment',
     'name': {'en': 'Founding Day (22 Feb)', 'ar': 'يوم التأسيس (22 فبراير)'},
     'why': {'en': 'A proud, family-friendly occasion with a strong heritage mood.',
             'ar': 'مناسبة فخر وعائلية بطابع تراثي واضح.'},
     'caution': {'en': 'Keep a respectful tone. No jokes with national symbols, and no sales tricks on the flag or emblem.',
                 'ar': 'خلّ النبرة محترمة. لا مزاح بالرموز الوطنية ولا استغلال للعلم أو الشعار في الخصومات.'}},
    {'id': 'asmr', 'kind': 'format',
     'name': {'en': 'Drink-making ASMR', 'ar': 'صوت التحضير (ASMR)'},
     'why': {'en': 'Close shots and the real sound of ice and pouring make a simple drink feel worth ordering. A phone is enough.',
             'ar': 'اللقطات القريبة وصوت الثلج والصب الحقيقي يخلون المشروب البسيط يستاهل الطلب. يكفي الجوال.'},
     'caution': {'en': 'Keep the cup and hands clean. Make no health claims about the ingredients.',
                 'ar': 'خلّ الكوب والأيدي نظيفة. لا تذكر فوائد صحية للمكونات.'}},
    {'id': 'pack-orders', 'kind': 'format',
     'name': {'en': 'Pack an order with me', 'ar': 'جهّز طلب معي'},
     'why': {'en': 'Shows the real person and the care behind each order, which builds trust for a new home shop.',
             'ar': 'يوري الشخص الحقيقي والاهتمام بكل طلب، وهذا يبني ثقة لمشروع منزلي جديد.'},
     'caution': {'en': 'Blur names, phone numbers and addresses on orders. Never show a customer\'s details.',
                 'ar': 'غطِّ الأسماء وأرقام الجوال والعناوين في الطلبات. لا تعرض بيانات أي عميل.'}},
    {'id': 'taste-test', 'kind': 'format',
     'name': {'en': 'First sip reaction', 'ar': 'أول رشفة'},
     'why': {'en': 'A real reaction is believable and easy to film. It works well for drinks and food.',
             'ar': 'ردة الفعل الحقيقية مقنعة وسهلة التصوير. تنفع مع المشروبات والأكل.'},
     'caution': {'en': 'Use real reactions only. Do not script fake reviews or pretend to be a customer.',
                 'ar': 'استخدم ردود فعل حقيقية فقط. لا تكتب مراجعات مزيفة ولا تتظاهر بأنك عميل.'}},
    {'id': 'pov', 'kind': 'format',
     'name': {'en': 'POV, the first-person moment', 'ar': 'منظور شخصي (POV)'},
     'why': {'en': 'Puts the viewer in the customer\'s place. Easy to shoot on a phone.',
             'ar': 'يحط المشاهد مكان العميل. سهل تصويره بالجوال.'},
     'caution': {'en': 'Keep the situation relatable and clean. No mocking customers.',
                 'ar': 'خلّ الموقف قريب من الناس ونظيف. لا تسخر من العملاء.'}},
    {'id': 'unboxing', 'kind': 'format',
     'name': {'en': 'Unboxing', 'ar': 'فتح العلبة (Unboxing)'},
     'why': {'en': 'Shows packaging and first impressions, which builds trust in a small brand.',
             'ar': 'يوري التغليف والانطباع الأول، وهذا يبني ثقة في العلامة الصغيرة.'},
     'caution': {'en': 'Only works if the real packaging looks good. Show it as it is.',
                 'ar': 'ينفع فقط لو التغليف الحقيقي حلو. اعرضه كما هو.'}},
    {'id': 'before-after', 'kind': 'format',
     'name': {'en': 'Before and after', 'ar': 'قبل وبعد'},
     'why': {'en': 'A clear visible change is the easiest proof a product works.',
             'ar': 'التغيير الواضح بالعين أسهل دليل إن المنتج يشتغل.'},
     'caution': {'en': 'Never retouch the result or promise outcomes you cannot show.',
                 'ar': 'لا تعدّل النتيجة بالفلاتر ولا تعد بنتائج ما تقدر تثبتها.'}},
    {'id': 'day-in-life', 'kind': 'format',
     'name': {'en': 'A day in the life of the shop', 'ar': 'يوم في حياة المشروع'},
     'why': {'en': 'Lets people meet the person behind the shop, which is trust in its simplest form.',
             'ar': 'يعرّف الناس بصاحب المشروع، وهذي أبسط صورة للثقة.'},
     'caution': {'en': 'Do not show customers\' faces or orders without their permission.',
                 'ar': 'لا تصوّر وجوه العملاء أو طلباتهم بدون إذنهم.'}},
    {'id': 'nostalgia', 'kind': 'format',
     'name': {'en': 'Nostalgia', 'ar': 'حنين للماضي'},
     'why': {'en': 'Old tastes, sounds and places bring warmth and make people share.',
             'ar': 'الطعم والصوت والمكان القديم يدفّي القلب ويخلي الناس تشارك.'},
     'caution': {'en': 'Keep references simple and accurate. Do not invent history.',
                 'ar': 'خلّ الإشارات بسيطة وصحيحة. لا تخترع تاريخ.'}},
]
TREND_TAGS = {
    'winter-mornings': ('#WinterMornings', '#صباحات_الشتاء'),
    'white-friday': ('#WhiteFriday', '#الجمعة_البيضاء'),
    'founding-day': ('#FoundingDay', '#يوم_التأسيس'),
    'pov': ('#POV', '#POV'),
    'unboxing': ('#Unboxing', '#فتح_العلبة'),
    'before-after': ('#BeforeAndAfter', '#قبل_وبعد'),
    'day-in-life': ('#DayInTheLife', '#يوم_في_حياتي'),
    'nostalgia': ('#Nostalgia', '#حنين'),
    'asmr': ('#ASMR', '#ASMR'),
    'pack-orders': ('#PackOrdersWithMe', '#جهز_طلب_معي'),
    'taste-test': ('#FirstSip', '#أول_رشفة'),
}
for _t in TRENDS:
    _t['tag'] = {'en': TREND_TAGS[_t['id']][0], 'ar': TREND_TAGS[_t['id']][1]}
TREND_BY_ID = {t['id']: t for t in TRENDS}
DEFAULT_TREND = 'winter-mornings'
PLATFORMS = ('TikTok', 'Instagram', 'Snapchat')
PLATFORM_NOTE = {
    'TikTok': {'en': 'Vertical video under 30 seconds works best here.',
               'ar': 'الفيديو الطولي أقل من 30 ثانية أنسب هنا.'},
    'Instagram': {'en': 'Reels, with a clear first frame, and a caption that stands alone.',
                  'ar': 'ريلز بلقطة أولى واضحة، وكابشن يكفي بنفسه.'},
    'Snapchat': {'en': 'Short and casual. Spotlight rewards quick, local, unpolished clips.',
                 'ar': 'قصير وعفوي. المحتوى المحلي السريع هو المناسب.'},
}

# --------------------------------------------------------------------------- models
Short = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class CampaignRequest(BaseModel):
    brand: Short
    product: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
    city: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] = 'Jeddah'
    audience: Annotated[str, StringConstraints(strip_whitespace=True, max_length=160)] = ''
    platform: Literal['TikTok', 'Instagram', 'Snapchat'] = 'TikTok'
    trend: str = DEFAULT_TREND
    goal: str = 'Brand awareness'
    description: str = Field(default='', max_length=2000)
    language: Lang = 'ar'


class Scene(BaseModel):
    scene: int
    duration: str
    visual: str
    voiceover: str


class PostingStep(BaseModel):
    day: str
    task: str


class Audience(BaseModel):
    who: str
    why: str


class Strategy(BaseModel):
    audience: Audience
    angle: str
    trustMoves: list[str] = Field(min_length=1)


class Content(BaseModel):
    title: str
    concept: str
    script: list[Scene] = Field(min_length=1)
    caption: str
    hashtags: list[str]
    postingPlan: list[PostingStep] = Field(min_length=1)


class Shot(BaseModel):
    scene: int
    shot: str
    text: str


class VisualBrief(BaseModel):
    theme: str
    format: str
    shots: list[Shot] = Field(min_length=1)


class Review(BaseModel):
    ok: bool
    notes: list[str]


# --------------------------------------------------------------------------- step 1
def trend_filter(req: CampaignRequest) -> dict:
    trend = TREND_BY_ID.get(req.trend)
    if trend is None:
        raise HTTPException(status_code=422, detail=f'Unknown trend "{req.trend}".')
    return trend


# --------------------------------------------------------------------------- demo engine
def _hashtag(text: str) -> str:
    return '#' + ''.join(ch for ch in text.title() if ch.isalnum())


FORMAT_SCENES = {
    'pov': {
        'en': [('0-3s', 'Eye-level shot: you are the customer, reaching for {product}.', 'POV: you finally found {product}.'),
               ('3-9s', 'Close-up of {product} in use. Hands only, natural light.', 'Made in {city}, by {brand}.'),
               ('9-15s', 'Cut to the owner of {brand} smiling at the camera.', 'Come and try it.')],
        'ar': [('0-3s', 'لقطة بمستوى النظر: أنت العميل تمد يدك على {product}.', 'POV: أخيرًا لقيت {product}.'),
               ('3-9s', 'لقطة قريبة لـ{product} وهو يُستخدم. أيدي فقط، إضاءة طبيعية.', 'من {city}، من {brand}.'),
               ('9-15s', 'نقطع على صاحب {brand} يبتسم للكاميرا.', 'تعال جرّب.')]},
    'unboxing': {
        'en': [('0-3s', 'A sealed {brand} package on a table. Hands slowly open it.', 'Guess what is inside?'),
               ('3-10s', 'Reveal {product}. Show texture and small details up close.', 'This is {product}, from {brand}.'),
               ('10-15s', 'Wrap it again as a gift. End on the {brand} name.', 'Ready to give.')],
        'ar': [('0-3s', 'علبة {brand} مغلقة على الطاولة. الأيدي تفتحها بهدوء.', 'خمّن وش داخلها؟'),
               ('3-10s', 'نكشف {product}. تفاصيل وملمس عن قرب.', 'هذا {product} من {brand}.'),
               ('10-15s', 'نغلّفه من جديد كهدية. نختم باسم {brand}.', 'جاهز للإهداء.')]},
    'before-after': {
        'en': [('0-4s', 'Show the problem as it really is, no filter.', 'This is how it looked.'),
               ('4-10s', 'Use {product} in one continuous shot.', 'One step with {product}.'),
               ('10-15s', 'Same angle, real result, then the {brand} name.', 'Same place. Different result.')],
        'ar': [('0-4s', 'نعرض المشكلة كما هي بدون فلتر.', 'كذا كان الوضع.'),
               ('4-10s', 'نستخدم {product} في لقطة واحدة متصلة.', 'خطوة وحدة مع {product}.'),
               ('10-15s', 'نفس الزاوية، النتيجة الحقيقية، ثم اسم {brand}.', 'نفس المكان. نتيجة ثانية.')]},
    'day-in-life': {
        'en': [('0-4s', 'Morning: the owner of {brand} opens the shop in {city}.', 'Every day starts the same way.'),
               ('4-11s', 'Making {product} by hand, with real sounds from the room.', 'This is how {product} is made.'),
               ('11-16s', 'A customer picks up their order and smiles.', 'Thank you for choosing small.')],
        'ar': [('0-4s', 'الصباح: صاحب {brand} يفتح المحل في {city}.', 'كل يوم يبدأ كذا.'),
               ('4-11s', 'تحضير {product} باليد مع أصوات المكان الحقيقية.', 'هكذا يتحضّر {product}.'),
               ('11-16s', 'عميل يستلم طلبه ويبتسم.', 'شكرًا إنك اخترت مشروع صغير.')]},
    'asmr': {
        'en': [('0-3s', 'Extreme close-up: ice drops into an empty cup. Real sound, no music yet.', 'No voiceover. Let the ice speak.'),
               ('3-10s', 'Pour {product} slowly, then the final touch. Hands only, bright window light.', '{product}, made fresh by {brand}.'),
               ('10-15s', 'The finished cup on a clean table. Text on screen: how to order.', 'Order from {brand} on {platform}.')],
        'ar': [('0-3s', 'لقطة قريبة جدًا: الثلج ينزل في كوب فاضي. الصوت حقيقي بدون موسيقى.', 'بدون تعليق. خلّ الثلج يتكلم.'),
               ('3-10s', 'نصب {product} ببطء ثم اللمسة الأخيرة. أيدي فقط وإضاءة نافذة.', '{product}، يتحضر طازج من {brand}.'),
               ('10-15s', 'الكوب الجاهز على طاولة نظيفة. نص على الشاشة: طريقة الطلب.', 'اطلب من {brand}.')]},
    'pack-orders': {
        'en': [('0-4s', 'A table with cups, labels and bags. The owner says hello without showing any customer details.', 'Pack the orders with me.'),
               ('4-11s', 'Seal each cup, add the label, place it in the bag. Blur every name and number.', 'Every order from {brand} is made and packed by hand.'),
               ('11-16s', 'Last bag ready for pickup. Show how to order.', 'Your order is next.')],
        'ar': [('0-4s', 'طاولة فيها كاسات وملصقات وأكياس. صاحبة أو صاحب المشروع يسلّم بدون أي بيانات عميل.', 'جهّز الطلبات معي.'),
               ('4-11s', 'نقفل كل كوب ونلصق الملصق ونحطه في الكيس. نغطي كل اسم ورقم.', 'كل طلب من {brand} يتحضر ويتغلّف باليد.'),
               ('11-16s', 'آخر كيس جاهز للاستلام. نوري طريقة الطلب.', 'طلبك الجاي.')]},
    'taste-test': {
        'en': [('0-3s', 'A sealed cup of {product} on the table. The tester has not tasted it yet.', 'First sip. No cuts.'),
               ('3-9s', 'One continuous take: straw in, first sip, honest face. No script.', '(real reaction, say what you actually think)'),
               ('9-15s', 'Hold the cup up to the camera with the {brand} name visible.', '{product}. From {brand}.')],
        'ar': [('0-3s', 'كوب {product} مقفل على الطاولة. من يجرّب لسا ما ذاقه.', 'أول رشفة. بدون قص.'),
               ('3-9s', 'لقطة وحدة متصلة: الشفاط، أول رشفة، وجه صادق. بدون نص.', '(ردة فعل حقيقية، قل اللي تحسه فعلًا)'),
               ('9-15s', 'نرفع الكوب للكاميرا واسم {brand} ظاهر.', '{product}. من {brand}.')]},
    'nostalgia': {
        'en': [('0-4s', 'An old photo, an old tune, or an old shop door in {city}.', 'Remember this?'),
               ('4-10s', 'Match the old detail to {product} with a smooth transition.', 'Some things stay good.'),
               ('10-15s', 'End with {product} on a table and the {brand} name.', 'Made the way it should be.')],
        'ar': [('0-4s', 'صورة قديمة أو لحن قديم أو باب محل قديم في {city}.', 'تتذكرون هذا؟'),
               ('4-10s', 'نربط التفصيلة القديمة بـ{product} بانتقال ناعم.', 'فيه أشياء تبقى حلوة.'),
               ('10-15s', 'نختم بـ{product} على طاولة واسم {brand}.', 'مصنوع كما يجب.')]},
}
MOMENT_SCENES = {
    'en': [('0-4s', 'Open on a real detail of this moment in {city} (weather, lights, street) with {product} in frame.', '{trend}, and {product} is ready.'),
           ('4-10s', 'Show {product} being used in a simple, honest way.', '{brand} made it for moments like this.'),
           ('10-15s', 'A clear, friendly closing line with the {brand} name.', 'Find us on {platform}.')],
    'ar': [('0-4s', 'نفتح بتفصيلة حقيقية من هذه المناسبة في {city} (الجو، الإضاءة، الشارع) و{product} في الكادر.', '{trend}، و{product} جاهز.'),
           ('4-10s', 'نعرض {product} وهو يُستخدم بطريقة بسيطة وصادقة.', '{brand} سوّاه لمثل هذي اللحظات.'),
           ('10-15s', 'جملة ختام واضحة وودودة مع اسم {brand}.', 'نلقاكم على {platform}.')]}

TRUST = {
    'en': ['Show the real person or place behind {brand} in the first 3 seconds.',
           'Answer every comment in the first 24 hours, in the same voice as the video.',
           'Put one honest detail where people can see it (price, ingredients or delivery time).'],
    'ar': ['وري الشخص أو المكان الحقيقي خلف {brand} في أول 3 ثواني.',
           'رد على كل تعليق خلال أول 24 ساعة، بنفس صوت الفيديو.',
           'حط تفصيلة صادقة وحدة ظاهرة للناس (السعر أو المكونات أو وقت التوصيل).'],
}
PLAN = {
    'en': [('Day 1', 'Review the script with the owner and list what to film.'),
           ('Day 2', 'Film the scenes on a phone, in daylight if possible.'),
           ('Day 3', 'Edit, add captions, and publish on {platform}.'),
           ('Day 5', 'Read the comments and note what people asked.')],
    'ar': [('اليوم 1', 'مراجعة النص مع صاحب المشروع وتحديد اللقطات المطلوبة.'),
           ('اليوم 2', 'تصوير المشاهد بالجوال، ويفضل في ضوء النهار.'),
           ('اليوم 3', 'مونتاج وإضافة النصوص ثم النشر على {platform}.'),
           ('اليوم 5', 'قراءة التعليقات وتسجيل أسئلة الناس.')],
}


class DemoEngine:
    """Template-based stand-in for the three model steps. Deterministic."""
    mode = 'demo'
    kind = 'template'

    def strategy(self, req, trend):
        L = req.language
        tname = trend['name'][L]
        fmt = dict(brand=req.brand, product=req.product, city=req.city or ('جدة' if L == 'ar' else 'Jeddah'), platform=req.platform, trend=tname)
        who = req.audience or (f'أهل {fmt["city"]} المتابعين لـ{req.platform}' if L == 'ar' else f'People in {fmt["city"]} who follow {req.platform}')
        why = (f'هم الأقرب لمشاهدة منشور بأسلوب «{tname}» عن {req.product} ومشاركته.' if L == 'ar'
               else f'They are the most likely to see and share a "{tname}" post about {req.product}.')
        angle = (f'نقدم {req.product} من خلال «{tname}» وبصوت صاحب المشروع.' if L == 'ar'
                 else f'Present {req.product} through "{tname}", in the owner\'s own voice.')
        return Strategy(audience=Audience(who=who, why=why), angle=angle,
                        trustMoves=[m.format(**fmt) for m in TRUST[L]])

    def content(self, req, strategy, trend):
        L = req.language
        city = req.city or ('جدة' if L == 'ar' else 'Jeddah')
        fmt = dict(brand=req.brand, product=req.product, city=city, platform=req.platform, trend=trend['name'][L])
        scenes = (FORMAT_SCENES[trend['id']][L] if trend['kind'] == 'format' else MOMENT_SCENES[L])
        title = f'{req.product}: {trend["name"][L]}'
        concept = (f'فيديو {req.platform} قصير لـ{req.brand}: {req.product} بأسلوب «{trend["name"][L]}»، وبصوت صاحب المشروع.' if L == 'ar'
                   else f'A short {req.platform} video for {req.brand}: {req.product}, told as "{trend["name"][L]}", in the owner\'s own voice.')
        caption = (f'{req.product} من {req.brand}، من {city} لكم. {_hashtag(req.brand)}' if L == 'ar'
                   else f'{req.product} by {req.brand}, from {city} to you. {_hashtag(req.brand)}')
        tags = [_hashtag(req.brand), _hashtag(city), trend['tag'][L], '#RAWI']
        return Content(
            title=title, concept=concept,
            script=[Scene(scene=i + 1, duration=d, visual=v.format(**fmt), voiceover=o.format(**fmt))
                    for i, (d, v, o) in enumerate(scenes)],
            caption=caption, hashtags=tags,
            postingPlan=[PostingStep(day=d, task=t.format(**fmt)) for d, t in PLAN[L]])

    def visual(self, req, content, trend):
        L = req.language
        theme = ('إضاءة طبيعية دافئة، خلفية هادئة بألوان محايدة، ولمسة لون واحدة من هوية العلامة.' if L == 'ar'
                 else 'Warm natural light, a calm neutral background, and one accent color from the brand.')
        fmt = ('عمودي 9:16، نحو 15 ثانية' if L == 'ar' else 'Vertical 9:16, about 15 seconds')
        kinds = (['لقطة قريبة، محمولة باليد', 'لقطة متوسطة، ثابتة', 'لقطة المنتج الرئيسية على حامل'] if L == 'ar'
                 else ['Close-up, handheld', 'Medium shot, steady', 'Hero shot of the product on a tripod'])
        shots = [Shot(scene=sc.scene, shot=kinds[i % len(kinds)], text=sc.voiceover) for i, sc in enumerate(content.script)]
        return VisualBrief(theme=theme, format=fmt, shots=shots)

    def review(self, req, content, trend):
        L = req.language
        notes = [trend['caution'][L], PLATFORM_NOTE[req.platform][L]]
        return Review(ok=True, notes=notes)


# --------------------------------------------------------------------------- gemini engine
VOICE = {
    'ar': 'Write in Arabic, in a light, friendly Saudi (white) dialect that a shop owner would say out loud. Avoid stiff formal Arabic.',
    'en': 'Write in plain, warm English.',
}
RULES = ('You work for a Saudi small business and have no marketing team. Be concrete and achievable with a phone camera. The main platform is TikTok: vertical video, a clear hook in the first two seconds, simple filming. '
         'Never invent statistics, live trend popularity, prices, discounts or performance results. '
         'Respect Saudi culture and religion. Return ONLY one valid JSON object, no markdown.')


class GeminiEngine:
    mode = 'gemini'
    kind = 'model'

    def _ask(self, prompt: str, cls):
        from google import genai
        client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
        response = client.models.generate_content(
            model=MODEL, contents=prompt, config={'response_mime_type': 'application/json'})
        return cls.model_validate_json(response.text)

    def _brief(self, req, trend):
        return (f'Business: {req.brand}. Product: {req.product}. City: {req.city or "Jeddah"}. '
                f'Audience given by owner: {req.audience or "(none, suggest one)"}. Platform: {req.platform}. '
                f'Goal: {req.goal}. Notes: {req.description or "(none)"}. '
                f'Chosen trend: {trend["name"]["en"]} ({trend["kind"]}). Why it fits: {trend["why"]["en"]} '
                f'Caution: {trend["caution"]["en"]}')

    def strategy(self, req, trend):
        prompt = (f'{RULES}\n{VOICE[req.language]}\n{self._brief(req, trend)}\n'
                  'Task: decide who exactly the customer is and how to earn their trust. '
                  'JSON keys: audience (object with who: one precise sentence, why: one sentence), '
                  'angle (one sentence), trustMoves (array of exactly 3 short, concrete actions).')
        return self._ask(prompt, Strategy)

    def content(self, req, strategy, trend):
        prompt = (f'{RULES}\n{VOICE[req.language]}\n{self._brief(req, trend)}\n'
                  f'Strategy: {strategy.model_dump_json()}\n'
                  'Task: write the campaign. JSON keys: title (string), concept (string), '
                  'script (array of 3 to 5 objects with scene integer, duration string like "0-4s", visual string, voiceover string), '
                  'caption (string, includes 2 to 4 hashtags), hashtags (array of strings), '
                  'postingPlan (array of 3 to 5 objects with day and task strings, starting Day 1).')
        return self._ask(prompt, Content)

    def visual(self, req, content, trend):
        prompt = (f'{RULES}\n{VOICE[req.language]}\n{self._brief(req, trend)}\n'
                  f'Script: {content.model_dump_json()}\n'
                  'Task: write a visual brief for filming this video on a phone. JSON keys: theme (string, light, colors and mood), '
                  'format (string, for example "Vertical 9:16, about 15 seconds"), '
                  'shots (array with one object per scene: scene integer, shot string describing framing and camera, text string for the on-screen text).')
        return self._ask(prompt, VisualBrief)

    def review(self, req, content, trend):
        prompt = (f'{RULES}\n{VOICE[req.language]}\n{self._brief(req, trend)}\n'
                  f'Campaign: {content.model_dump_json()}\n'
                  'Task: check this campaign for brand safety and cultural fit in Saudi Arabia. '
                  'JSON keys: ok (boolean, false only if something must change), notes (array of at most 3 short strings).')
        return self._ask(prompt, Review)


# --------------------------------------------------------------------------- pipeline
def assemble(req: CampaignRequest, engine, trend, strategy, content, visual, review, steps) -> dict:
    L = req.language
    scenes = len(content.script)
    hours = round(1.5 + scenes * 0.75, 1)
    note = ('تقدير تقريبي لتصوير ومونتاج الفيديو بالجوال، وليس رقمًا مقاسًا.' if L == 'ar'
            else 'A rough estimate for phone filming and editing, not a measured number.')
    return {
        **content.model_dump(),
        'audience': strategy.audience.model_dump(),
        'angle': strategy.angle,
        'trustMoves': strategy.trustMoves,
        'visual': visual.model_dump() if visual else None,
        'brandSafety': {'fit': trend['why'][L], 'caution': trend['caution'][L],
                        'ok': review.ok if review else True,
                        'notes': review.notes if review else [PLATFORM_NOTE[req.platform][L]]},
        'effort': {'hours': hours, 'note': note},
        'trend': {'id': trend['id'], 'name': trend['name'][L], 'kind': trend['kind'], 'asOf': TRENDS_AS_OF},
        'pipeline': steps,
        'generationMode': engine.mode,
        'language': L,
    }


def run_pipeline(req: CampaignRequest, engine) -> dict:
    steps = []

    def timed(agent, kind, fn):
        start = time.perf_counter()
        out = fn()
        steps.append({'agent': agent, 'kind': kind, 'ms': round((time.perf_counter() - start) * 1000)})
        return out

    trend = timed('trend', 'rule', lambda: trend_filter(req))
    strategy = timed('strategy', engine.kind, lambda: engine.strategy(req, trend))
    content = timed('content', engine.kind, lambda: engine.content(req, strategy, trend))
    visual = timed('visual', engine.kind, lambda: engine.visual(req, content, trend))
    return assemble(req, engine, trend, strategy, content, visual, None, steps)


def pick_engine():
    return GeminiEngine() if os.getenv('GEMINI_API_KEY') else DemoEngine()


# --------------------------------------------------------------------------- routes
@app.get('/api/health')
def health():
    return {'status': 'ok', 'mode': pick_engine().mode, 'model': MODEL if os.getenv('GEMINI_API_KEY') else None}


@app.get('/api/trends')
def trends():
    return {'source': 'curated sample', 'asOf': TRENDS_AS_OF, 'live': False, 'items': TRENDS}


@app.post('/api/generate')
def generate(req: CampaignRequest):
    try:
        return run_pipeline(req, pick_engine())
    except HTTPException:
        raise
    except Exception as exc:  # model or parsing failure
        raise HTTPException(
            status_code=502,
            detail=f'Generation failed at a model step ({type(exc).__name__}). Check your API key and retry.')


# --------------------------------------------------------------------------- step-by-step routes
# The web app calls these one after another so the owner can watch each agent work.
class StrategyIn(BaseModel):
    req: CampaignRequest


class ContentIn(BaseModel):
    req: CampaignRequest
    strategy: Strategy


class VisualIn(BaseModel):
    req: CampaignRequest
    content: Content


class ReviewIn(BaseModel):
    req: CampaignRequest
    content: Content


class FinishIn(BaseModel):
    req: CampaignRequest
    strategy: Strategy
    content: Content
    visual: VisualBrief | None = None
    review: Review | None = None
    steps: list[dict]


def _timed(fn):
    start = time.perf_counter()
    out = fn()
    return out, round((time.perf_counter() - start) * 1000)


def _guard(fn):
    try:
        return fn()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Generation failed at a model step ({type(exc).__name__}). Check your API key and retry.')


@app.post('/api/agent/trend')
def agent_trend(req: CampaignRequest):
    trend, ms = _timed(lambda: trend_filter(req))
    return {'agent': 'trend', 'kind': 'rule', 'ms': ms, 'mode': pick_engine().mode, 'out': trend}


@app.post('/api/agent/strategy')
def agent_strategy(body: StrategyIn):
    engine = pick_engine()
    trend = trend_filter(body.req)
    out, ms = _guard(lambda: _timed(lambda: engine.strategy(body.req, trend)))
    return {'agent': 'strategy', 'kind': engine.kind, 'ms': ms, 'out': out.model_dump()}


@app.post('/api/agent/content')
def agent_content(body: ContentIn):
    engine = pick_engine()
    trend = trend_filter(body.req)
    out, ms = _guard(lambda: _timed(lambda: engine.content(body.req, body.strategy, trend)))
    return {'agent': 'content', 'kind': engine.kind, 'ms': ms, 'out': out.model_dump()}


@app.post('/api/agent/visual')
def agent_visual(body: VisualIn):
    engine = pick_engine()
    trend = trend_filter(body.req)
    out, ms = _guard(lambda: _timed(lambda: engine.visual(body.req, body.content, trend)))
    return {'agent': 'visual', 'kind': engine.kind, 'ms': ms, 'out': out.model_dump()}


@app.post('/api/agent/review')
def agent_review(body: ReviewIn):
    engine = pick_engine()
    trend = trend_filter(body.req)
    out, ms = _guard(lambda: _timed(lambda: engine.review(body.req, body.content, trend)))
    return {'agent': 'review', 'kind': engine.kind, 'ms': ms, 'out': out.model_dump()}


@app.post('/api/agent/finish')
def agent_finish(body: FinishIn):
    engine = pick_engine()
    return assemble(body.req, engine, trend_filter(body.req), body.strategy, body.content, body.visual, body.review, body.steps)
