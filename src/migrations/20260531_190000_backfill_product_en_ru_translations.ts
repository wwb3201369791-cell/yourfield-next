import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const backfillProductEnRuTranslationsSql = `
WITH translations(product_id, locale, name, description) AS (
  VALUES
    ('1-ji-fang-dian-hu-fu-chen-shan-kuan', 'en', 'Level 1 Arc Flash Shirt-Style Suit', 'For power grids, photovoltaic and new energy facilities, substations, distribution rooms, routine inspection, and light electrical work in low arc-risk environments. Select protection according to the calculated arc energy of the task.'),
    ('1-ji-fang-dian-hu-fu-chen-shan-kuan', 'ru', 'Костюм от дуговой вспышки уровня 1, рубашечный', 'Для электросетей, фотоэлектрических и новых энергетических объектов, подстанций, распределительных помещений, плановых осмотров и легких электротехнических работ с низким риском дуговой вспышки. Выбирайте защиту по расчетной энергии дуги.'),
    ('arc-flash-suit', 'en', 'Level 1 Arc Flash Jacket-Style Suit', 'For electrical power grids, photovoltaic sites, new energy facilities, substations, and industrial electrical work where arc flash exposure may occur. Suitable for low-voltage and routine maintenance tasks after arc-energy assessment.'),
    ('arc-flash-suit', 'ru', 'Костюм от дуговой вспышки уровня 1, курточный', 'Для электросетей, фотоэлектрических объектов, новых энергетических объектов, подстанций и промышленных электротехнических работ с возможным воздействием дуговой вспышки. Подходит для низковольтных и плановых задач после оценки энергии дуги.'),
    ('2-ji-fang-dian-hu-fu-jia-ke-kuan', 'en', 'Level 2 Arc Flash Jacket-Style Suit', 'For power grids, photovoltaic projects, new energy facilities, and industrial substations where electrical workers may be exposed to arc flash hazards. Suitable for medium-risk switching, inspection, and maintenance tasks after arc-energy assessment.'),
    ('2-ji-fang-dian-hu-fu-jia-ke-kuan', 'ru', 'Костюм от дуговой вспышки уровня 2, курточный', 'Для электросетей, солнечных и новых энергетических объектов, а также промышленных подстанций, где персонал может столкнуться с риском дуговой вспышки. Подходит для работ среднего риска после оценки энергии дуги.'),
    ('3-ji-fang-dian-hu-fu-da-gua-bei-dai-ku-kuan-3-4-c-a-l', 'en', 'Level 3 Arc Flash Coat and Bib Overall Suit, 34 cal', 'For high-voltage substations, power plant operation and maintenance, fault repair, and other higher arc-energy environments. Use after evaluating the actual arc-energy level of the work scene.'),
    ('3-ji-fang-dian-hu-fu-da-gua-bei-dai-ku-kuan-3-4-c-a-l', 'ru', 'Костюм от дуговой вспышки уровня 3, халат и полукомбинезон, 34 cal', 'Для высоковольтных подстанций, эксплуатации и обслуживания электростанций, аварийного ремонта и других зон с повышенной энергией дуги. Применяется после оценки фактической энергии дуги на рабочем месте.'),
    ('3-ji-fang-dian-hu-fu-jia-ke-kuan-3-4-c-a-l', 'en', 'Level 3 Arc Flash Jacket-Style Suit, 34 cal', 'For high-voltage substations, power plant maintenance, fault repair, and electrical tasks with higher arc flash exposure. Select according to the arc-energy value of the specific operation.'),
    ('3-ji-fang-dian-hu-fu-jia-ke-kuan-3-4-c-a-l', 'ru', 'Костюм от дуговой вспышки уровня 3, курточный, 34 cal', 'Для высоковольтных подстанций, обслуживания электростанций, аварийного ремонта и электротехнических работ с повышенным риском дуговой вспышки. Подбирается по значению энергии дуги конкретной операции.'),
    ('4-ji-fang-dian-hu-fu-da-gua-bei-dai-ku-kuan-4-1-c-a-l', 'en', 'Level 4 Arc Flash Coat and Bib Overall Suit, 41 cal', 'For ultra-high-voltage substations, short-circuit testing, severe fault arc scenarios, and other extreme electrical hazard environments. Select only after evaluating the arc-energy level of the task.'),
    ('4-ji-fang-dian-hu-fu-da-gua-bei-dai-ku-kuan-4-1-c-a-l', 'ru', 'Костюм от дуговой вспышки уровня 4, халат и полукомбинезон, 41 cal', 'Для сверхвысоковольтных подстанций, испытаний короткого замыкания, сильных аварийных дуг и других особо опасных электрических условий. Применяется только после оценки энергии дуги.'),
    ('4-ji-fang-dian-hu-fu-jia-ke-kuan-4-1-c-a-l', 'en', 'Level 4 Arc Flash Jacket-Style Suit, 41 cal', 'For ultra-high-voltage substations, short-circuit tests, severe fault arc exposure, and extreme-risk electrical work. Choose the garment according to the calculated arc-energy level.'),
    ('4-ji-fang-dian-hu-fu-jia-ke-kuan-4-1-c-a-l', 'ru', 'Костюм от дуговой вспышки уровня 4, курточный, 41 cal', 'Для сверхвысоковольтных подстанций, испытаний короткого замыкания, сильного воздействия аварийной дуги и электротехнических работ с экстремальным риском. Подбирается по расчетной энергии дуги.'),
    ('5-0-0-k-v-dai-dian-zuo-ye-yong-ping-bi-fu', 'en', '500 kV Live-Line Shielding Suit', 'For maintenance, testing, and repair on energized overhead transmission lines and electrical equipment up to 500 kV. Choose this shielding suit according to the operating voltage level.'),
    ('5-0-0-k-v-dai-dian-zuo-ye-yong-ping-bi-fu', 'ru', 'Экранирующий костюм для работ под напряжением 500 кВ', 'Для обслуживания, испытаний и ремонта на воздушных линиях электропередачи и электрооборудовании под напряжением до 500 кВ. Выбирается в соответствии с рабочим уровнем напряжения.'),
    ('5-0-0-k-v-jiao-liu-gao-ya-jing-dian-fu', 'en', '500 kV AC High-Voltage Anti-Static Suit', 'For power grids, transmission lines, substations, patrol work, and ground-potential operations on AC transmission systems. Recommended for 110 kV to 500 kV work environments.'),
    ('5-0-0-k-v-jiao-liu-gao-ya-jing-dian-fu', 'ru', 'Антистатический костюм переменного тока высокого напряжения 500 кВ', 'Для электросетей, линий электропередачи, подстанций, обходов и работ с потенциалом земли на системах переменного тока. Рекомендуется для условий от 110 кВ до 500 кВ.'),
    ('7-5-0-k-v-dai-dian-zuo-ye-yong-ping-bi-fu', 'en', '750 kV Live-Line Shielding Suit', 'For live maintenance, testing, and repair on energized overhead transmission lines and electrical equipment up to 750 kV. Select according to the site voltage level.'),
    ('7-5-0-k-v-dai-dian-zuo-ye-yong-ping-bi-fu', 'ru', 'Экранирующий костюм для работ под напряжением 750 кВ', 'Для обслуживания, испытаний и ремонта воздушных линий электропередачи и электрооборудования под напряжением до 750 кВ. Подбирается по уровню напряжения объекта.'),
    ('fang-jing-dian-chun-qiu-fen-ti-tao-zhuang', 'en', 'Anti-Static Spring/Autumn Two-Piece Suit', 'For rail transit, automotive manufacturing, new energy equipment, petrochemical sites, gas stations, and laboratories where static accumulation is a concern. Designed for spring and autumn work without open-flame risk.'),
    ('fang-jing-dian-chun-qiu-fen-ti-tao-zhuang', 'ru', 'Антистатический двухкомпонентный костюм для весны и осени', 'Для рельсового транспорта, автопроизводства, оборудования новой энергетики, нефтехимических объектов, газовых станций и лабораторий с риском накопления статического электричества. Предназначен для весенне-осенних работ без риска открытого пламени.'),
    ('fang-jing-dian-xia-ji-fen-ti-tao-zhuang', 'en', 'Anti-Static Summer Two-Piece Suit', 'For rail transit, automotive manufacturing, new energy equipment, petrochemical operations, gas facilities, and laboratories where static accumulation may occur. Designed for summer work without open-flame or sudden ignition risk.'),
    ('fang-jing-dian-xia-ji-fen-ti-tao-zhuang', 'ru', 'Антистатический летний двухкомпонентный костюм', 'Для рельсового транспорта, автопроизводства, оборудования новой энергетики, нефтехимии, газовых объектов и лабораторий с риском статического электричества. Предназначен для летних работ без риска открытого пламени или внезапного возгорания.'),
    ('fang-jing-dian-xia-ji-lian-ti-fu', 'en', 'Anti-Static Summer Coverall', 'For rail transit, automotive manufacturing, new energy equipment, petrochemical facilities, gas stations, and laboratories with static accumulation risk. A summer coverall for environments without open-flame or sudden fire hazards.'),
    ('fang-jing-dian-xia-ji-lian-ti-fu', 'ru', 'Антистатический летний комбинезон', 'Для рельсового транспорта, автопроизводства, оборудования новой энергетики, нефтехимических объектов, газовых станций и лабораторий с риском статического электричества. Летний комбинезон для зон без открытого пламени и внезапного пожара.'),
    ('i-i-ji-fang-dian-hu-fu-jia-ke-tao-zhuang-8-5-c-a-l', 'en', 'Class II Arc Flash Jacket Set, 8.5 cal', 'A Class II arc flash jacket set rated 8.5 cal for routine electrical operations where arc-flash protection is required. Use according to the assessed arc-energy exposure.'),
    ('i-i-ji-fang-dian-hu-fu-jia-ke-tao-zhuang-8-5-c-a-l', 'ru', 'Курточный комплект защиты от дуговой вспышки класса II, 8.5 cal', 'Курточный комплект класса II с рейтингом 8.5 cal для стандартных электротехнических работ, где требуется защита от дуговой вспышки. Применяется по результатам оценки энергии дуги.'),
    ('live-line-shielding-suit', 'en', '1000 kV Live-Line Shielding Suit', 'For energized maintenance, testing, and repair on overhead transmission lines and electrical equipment up to 1000 kV. Recommended for operations selected by voltage level.'),
    ('live-line-shielding-suit', 'ru', 'Экранирующий костюм для работ под напряжением 1000 кВ', 'Для обслуживания, испытаний и ремонта воздушных линий электропередачи и электрооборудования под напряжением до 1000 кВ. Рекомендуется для работ, выбранных по уровню напряжения.'),
    ('firefighter-suit-combat', 'en', 'Firefighter Protective Suit (Combat Style)', 'The combat-style firefighter protective suit uses a three-layer aramid composite structure for fire suppression, emergency rescue, and disaster response, providing flame resistance, heat insulation, waterproof breathability, durability, and anti-static protection.'),
    ('firefighter-suit-combat', 'ru', 'Пожарный защитный костюм, боевой тип', 'Боевой пожарный защитный костюм выполнен из трехслойного арамидного композита для тушения пожаров, аварийно-спасательных работ и ликвидации последствий ЧС. Обеспечивает огнестойкость, теплоизоляцию, водонепроницаемость с паропроницаемостью, прочность и антистатическую защиту.'),
    ('1-7-shi-sen-lin-fang-huo-fu', 'en', 'Type 17 Forest Firefighting Suit', 'For forest and grassland fires, mountain rescue, and initial rescue tasks in complex terrain where workers need protection against high temperature and intense radiant heat.'),
    ('1-7-shi-sen-lin-fang-huo-fu', 'ru', 'Лесопожарный костюм типа 17', 'Для лесных и степных пожаров, горно-спасательных работ и первичных спасательных задач на сложном рельефе, где персоналу нужна защита от высокой температуры и интенсивного теплового излучения.'),
    ('xiao-fang-yuan-mie-huo-fang-hu-fu-zhi-hui-kuan', 'en', 'Firefighter Protective Suit (Command Style)', 'For firefighting and rescue operations, emergency response, and disaster handling where personnel need combined protection against heat, flame, thermal radiation, and mechanical injury.'),
    ('xiao-fang-yuan-mie-huo-fang-hu-fu-zhi-hui-kuan', 'ru', 'Пожарный защитный костюм, командирский тип', 'Для тушения пожаров, спасательных операций, аварийного реагирования и ликвидации ЧС, где персоналу требуется комплексная защита от жара, пламени, теплового излучения и механических повреждений.'),
    ('xiao-fang-yuan-qiang-xian-jiu-yuan-fu-dong-kuan-2', 'en', 'Firefighter Rescue Suit (Winter Style)', 'For winter rescue operations, emergency response, building collapse, natural disasters, and urban flooding where firefighters need integrated protection in hot, humid, and complex non-fire rescue environments.'),
    ('xiao-fang-yuan-qiang-xian-jiu-yuan-fu-dong-kuan-2', 'ru', 'Спасательный костюм пожарного, зимний тип', 'Для зимних спасательных работ, аварийного реагирования, обрушений зданий, стихийных бедствий и городских подтоплений, где пожарным нужна комплексная защита в жарких, влажных и сложных неогневых условиях.'),
    ('xiao-fang-yuan-qiang-xian-jiu-yuan-fu-xia-kuan-2', 'en', 'Firefighter Rescue Suit (Summer Style)', 'For summer rescue operations, flood control, disaster relief, and urban flooding where firefighters need integrated protection for non-fire rescue tasks in hot and humid environments.'),
    ('xiao-fang-yuan-qiang-xian-jiu-yuan-fu-xia-kuan-2', 'ru', 'Спасательный костюм пожарного, летний тип', 'Для летних спасательных работ, борьбы с паводками, ликвидации стихийных бедствий и городских подтоплений, где пожарным нужна комплексная защита для неогневых спасательных задач в жаркой и влажной среде.'),
    ('official-hyf-3537', 'en', 'Molten Metal Splash Protective Clothing', 'Protective clothing for metal smelting, casting, and other workplaces with molten metal splash hazards. It helps block aluminum, iron, slag, and high-temperature splashes, reducing burn risk while providing flame resistance and heat insulation.'),
    ('official-hyf-3537', 'ru', 'Защитная одежда от брызг расплавленного металла', 'Защитная одежда для металлургии, литейного производства и других мест с риском брызг расплавленного металла. Помогает блокировать алюминий, железо, шлак и высокотемпературные брызги, снижая риск ожогов, а также обеспечивает огнестойкость и теплоизоляцию.'),
    ('official-hyf-3105', 'en', 'Class A Flame-Resistant Suit', 'Protective clothing that resists ignition, afterflame, and smoldering for a limited time after contact with flame or hot objects. After the heat source is removed, the burned area carbonizes quickly without melting or dripping, helping reduce burn injuries.'),
    ('official-hyf-3105', 'ru', 'Огнестойкий костюм класса A', 'Защитная одежда, которая в течение ограниченного времени сопротивляется воспламенению, открытому горению и тлению после контакта с пламенем или горячими предметами. После удаления источника тепла обугливается без плавления и капель, помогая снизить риск ожогов.'),
    ('b-ji-han-jie-fen-ti-tao-zhuang', 'en', 'Class B Welding Two-Piece Suit', 'For shipbuilding, steel structure processing, machinery manufacturing, and regular welding operations outside the highest-risk Class A positions. Suitable for flat, vertical, and horizontal welding in open workspaces with relatively lower splash risk.'),
    ('b-ji-han-jie-fen-ti-tao-zhuang', 'ru', 'Сварочный двухкомпонентный костюм класса B', 'Для судостроения, обработки стальных конструкций, машиностроения и обычных сварочных работ вне зон наивысшего риска класса A. Подходит для нижней, вертикальной и горизонтальной сварки на открытых рабочих местах с относительно меньшим риском брызг.'),
    ('welding-protective-clothing', 'en', 'Class A Welding Suit', 'For shipbuilding, steel structure processing, machinery manufacturing, overhead welding, high-altitude work, confined spaces, and other high-risk welding positions where workers may face molten splash and heat hazards.'),
    ('welding-protective-clothing', 'ru', 'Сварочный костюм класса A', 'Для судостроения, обработки стальных конструкций, машиностроения, потолочной сварки, высотных работ, ограниченных пространств и других сварочных позиций высокого риска с опасностью расплавленных брызг и тепла.'),
    ('zhi-neng-jiang-wen-kong-tiao-han-jie-fen-ti-tao-zhuang', 'en', 'Smart Cooling Air-Conditioned Welding Two-Piece Suit', 'A two-piece welding suit with smart cooling and air-conditioned comfort support for high-temperature welding environments. Designed to improve wearer comfort while maintaining welding splash and heat protection.'),
    ('zhi-neng-jiang-wen-kong-tiao-han-jie-fen-ti-tao-zhuang', 'ru', 'Сварочный двухкомпонентный костюм с интеллектуальным охлаждением', 'Двухкомпонентный сварочный костюм с интеллектуальным охлаждением и кондиционируемой поддержкой комфорта для высокотемпературной сварочной среды. Помогает повысить комфорт пользователя при сохранении защиты от сварочных брызг и тепла.'),
    ('official-yftg-fs24526', 'en', 'Microwave Radiation Protective Suit, Two-Piece', 'A two-piece protective suit that shields and absorbs microwave radiation, reflecting or attenuating electromagnetic energy applied to the body to improve occupational and public safety.'),
    ('official-yftg-fs24526', 'ru', 'Защитный костюм от микроволнового излучения, двухкомпонентный', 'Двухкомпонентный защитный костюм, который экранирует и поглощает микроволновое излучение, отражая или ослабляя электромагнитную энергию, воздействующую на тело, для повышения производственной и общественной безопасности.'),
    ('official-hyf-6735', 'en', 'Disposable Chemical Protective Suit', 'Provides temporary and effective chemical protection for the wearer, helping prevent harmful chemicals from contacting the skin or being inhaled during hazardous handling tasks.'),
    ('official-hyf-6735', 'ru', 'Одноразовый химический защитный костюм', 'Обеспечивает временную и эффективную химическую защиту пользователя, помогая предотвратить контакт вредных химических веществ с кожей или их вдыхание при опасных работах.'),
    ('official-hyf-3301', 'en', 'Flame-Resistant Anti-Static Suit (Summer Style)', 'For environments with flame, hot objects, static sensitivity, or explosion risk. The garment resists ignition, limits afterflame and smoldering, carbonizes without melting or dripping, and helps reduce static accumulation.'),
    ('official-hyf-3301', 'ru', 'Огнестойкий антистатический костюм, летний тип', 'Для сред с пламенем, горячими предметами, чувствительностью к статике или риском взрыва. Одежда сопротивляется воспламенению, ограничивает горение и тление, обугливается без плавления и капель, а также помогает уменьшить накопление статического электричества.'),
    ('chemical-protective-suit', 'en', 'Disposable Chemical Protective Clothing', 'Disposable chemical protective clothing for chemical handling, emergency response, and industrial protection scenarios requiring barrier protection against hazardous substances.'),
    ('chemical-protective-suit', 'ru', 'Одноразовая химическая защитная одежда', 'Одноразовая химическая защитная одежда для работы с химическими веществами, аварийного реагирования и промышленных задач, где требуется барьерная защита от опасных веществ.'),
    ('chun-qiu-zu-ran-fang-jing-dian-fu-shuang-ceng-jia-ke-kuan', 'en', 'Spring/Autumn Flame-Resistant Anti-Static Jacket, Double Layer', 'A double-layer spring and autumn jacket that combines flame-resistant and anti-static protection for industrial workplaces with static, spark, or heat exposure risks.'),
    ('chun-qiu-zu-ran-fang-jing-dian-fu-shuang-ceng-jia-ke-kuan', 'ru', 'Двухслойная огнестойкая антистатическая куртка для весны и осени', 'Двухслойная куртка для весны и осени, сочетающая огнестойкую и антистатическую защиту для промышленных рабочих мест с риском статического электричества, искр или теплового воздействия.'),
    ('medical-protective-clothing', 'en', 'Medical Protective Clothing', 'Protective clothing for medical and public health scenarios, helping provide barrier protection for healthcare, hygiene, and emergency response work.'),
    ('medical-protective-clothing', 'ru', 'Медицинская защитная одежда', 'Защитная одежда для медицинских и санитарно-эпидемиологических сценариев, помогающая обеспечить барьерную защиту при работе в здравоохранении, гигиене и аварийном реагировании.'),
    ('wei-bo-fu-she-fang-hu-fu-da-gua', 'en', 'Microwave Radiation Protective Coat', 'A coat-style garment for microwave radiation protection, designed to shield, reflect, and attenuate electromagnetic energy in occupational environments.'),
    ('wei-bo-fu-she-fang-hu-fu-da-gua', 'ru', 'Защитный халат от микроволнового излучения', 'Халат для защиты от микроволнового излучения, предназначенный для экранирования, отражения и ослабления электромагнитной энергии в производственной среде.'),
    ('zu-ran-fang-jing-dian-quan-mian-qiu-ji-tao-zhuang', 'en', 'Cotton Flame-Resistant Anti-Static Autumn Set', 'For refineries, chemical plants, oil and gas production and transport, gas stations, and tank farms where static sensitivity, combustible gas or dust, sparks, open flame, or sudden ignition may be present.'),
    ('zu-ran-fang-jing-dian-quan-mian-qiu-ji-tao-zhuang', 'ru', 'Хлопковый огнестойкий антистатический осенний комплект', 'Для нефтеперерабатывающих и химических заводов, добычи и транспорта нефти и газа, АЗС и резервуарных парков, где возможны статическая чувствительность, горючий газ или пыль, искры, открытое пламя или внезапное возгорание.'),
    ('dry-water-rescue-suit-hyf-9905', 'en', 'Dry Water Rescue Suit', 'A dry water rescue suit for cold seasons, low-temperature water rescue, flood response, torrents, mudflats, marshes, and other complex water rescue conditions. It isolates cold and contaminated water, reduces hypothermia risk, and supports mobility during long immersion.'),
    ('dry-water-rescue-suit-hyf-9905', 'ru', 'Сухой костюм для спасения на воде', 'Сухой спасательный костюм для холодного сезона, спасения в холодной воде, паводков, бурных потоков, илистых отмелей, болот и других сложных водных условий. Изолирует холодную и загрязненную воду, снижает риск переохлаждения и поддерживает подвижность при длительном нахождении в воде.')
), localized_translations AS (
  SELECT
    product_id,
    locale,
    name,
    jsonb_build_object(
      'root', jsonb_build_object(
        'children', jsonb_build_array(
          jsonb_build_object(
            'children', jsonb_build_array(
              jsonb_build_object(
                'detail', 0,
                'format', 0,
                'mode', 'normal',
                'style', '',
                'text', description,
                'type', 'text',
                'version', 1
              )
            ),
            'direction', null,
            'format', '',
            'indent', 0,
            'type', 'paragraph',
            'version', 1
          )
        ),
        'direction', null,
        'format', '',
        'indent', 0,
        'type', 'root',
        'version', 1
      )
    ) AS description_json
  FROM translations
)
INSERT INTO products_locales (name, description, _locale, _parent_id)
SELECT localized_translations.name,
  localized_translations.description_json,
  localized_translations.locale::_locales,
  products.id
FROM localized_translations
JOIN products ON products.product_id = localized_translations.product_id
ON CONFLICT (_locale, _parent_id) DO UPDATE
SET name = CASE
    WHEN NULLIF(trim(products_locales.name), '') IS NULL THEN EXCLUDED.name
    ELSE products_locales.name
  END,
  description = CASE
    WHEN NULLIF(trim(products_locales.description #>> '{root,children,0,children,0,text}'), '') IS NULL
      THEN EXCLUDED.description
    ELSE products_locales.description
  END
WHERE NULLIF(trim(products_locales.name), '') IS NULL
  OR NULLIF(trim(products_locales.description #>> '{root,children,0,children,0,text}'), '') IS NULL;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(backfillProductEnRuTranslationsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally left blank: do not automatically remove production content translations.
}
