/*
 * Content of the footer pages (terms, privacy, payment, service controls, SLA, FAQs, ...).
 * Arabic text is taken from the municipality's current website (edm.gov.om); English is a
 * faithful translation. Edit the text here — the pages render whatever this file contains.
 */

export const SITE_LAST_UPDATED = '2026-09-28';
export const CONTACT = {
  callCenter: '1771',
  whatsapp: '91484042',
  itsEmail: 'its@dm.gov.om',
  infoEmail: 'info@dm.gov.om',
  website: 'www.edm.gov.om',
};

export type Bi = { ar: string; en: string };
export type DocBlock =
  | { type: 'p'; text: Bi }
  | { type: 'list'; items: Bi[]; ordered?: boolean }
  | { type: 'note'; text: Bi; tone?: 'info' | 'warning' }
  | { type: 'contact'; items: { kind: 'phone' | 'whatsapp' | 'email' | 'web'; value: string; label: Bi }[] };

export interface DocSection { id: string; title: Bi; blocks: DocBlock[] }

export interface LegalDoc {
  slug: string;
  title: Bi;
  intro: Bi;
  icon: string;
  updated: string;
  sections: DocSection[];
}

const p = (ar: string, en: string): DocBlock => ({ type: 'p', text: { ar, en } });
const list = (items: [string, string][], ordered = false): DocBlock => ({ type: 'list', ordered, items: items.map(([ar, en]) => ({ ar, en })) });

/* ------------------------------------------------------------------ */

export const TERMS: LegalDoc = {
  slug: 'terms',
  icon: 'ScrollText',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  intro: {
    ar: 'أُنشئ موقع بلدية ظفار لاستخدامك الشخصي ولاطلاعك، ويشكّل دخولك للموقع واستخدامه موافقة منك على هذه الأحكام والشروط وسياسة الخصوصية التي تعتبر شرطاً من شروط استخدام الموقع وجميع القوانين المعمول بها.',
    en: 'The Dhofar Municipality website is provided for your personal use and information. By accessing and using it you agree to these terms and conditions and to the privacy policy, which are conditions of use of the website, together with all applicable laws.',
  },
  sections: [
    {
      id: 'acceptable-use', title: { ar: 'سياسة الاستخدام المقبول – استخدام الموقع', en: 'Acceptable use policy' },
      blocks: [
        p('لا يجوز لك استخدام هذا الموقع إلا وفقاً للشروط القانونية التي تنظم ذلك، والتي تشمل الالتزام بجميع القوانين واللوائح وقواعد السلوك المعمول بها داخل حدود سلطنة عمان أو القوانين واللوائح والقواعد الأخرى المعمول بها في المكان الذي تدخل منه إلى هذا الموقع. وبصفة خاصة، فإنك توافق على عدم القيام بما يلي:',
          'You may only use this website in accordance with the legal terms that govern it, including all laws, regulations and codes of conduct in force in the Sultanate of Oman, or the laws and rules in force where you access the website from. In particular, you agree not to:'),
        list([
          ['استخدام هذا الموقع بطريقة تتسبب أو يحتمل أن تتسبب في انتهاك الحقوق الخاصة ببلدية ظفار و/أو أي طرف ثالث.', 'Use this website in a way that infringes, or is likely to infringe, the rights of Dhofar Municipality and/or any third party.'],
          ['إرسال أو نقل أو نشر أية معلومات تكون أو يحتمل أن تكون ضارة أو مخلة بالآداب أو افترائية أو غير قانونية أو تعطيل السرد الطبيعي للمحتويات المتضمنة على الموقع أو من خلاله.', 'Send, transmit or publish any information that is, or may be, harmful, indecent, defamatory or unlawful, or disrupt the normal flow of content on or through the website.'],
          ['محاولة التدخل في عملية تشغيل الموقع أو الوظائف الخاصة به، بما في ذلك – على سبيل المثال لا الحصر – تحميل أو تنزيل أو نقل الملفات التالفة أو فيروسات الحاسب أو المواد الأخرى الضارة أو استخدام أي برامج أو إجراءات أو أجهزة بهدف التدخل في الموقع.', 'Attempt to interfere with the operation or functions of the website, including — without limitation — uploading, downloading or transmitting corrupted files, computer viruses or other harmful material, or using any software, procedure or device to interfere with the website.'],
          ['اتخاذ أي إجراء ينجم عنه تحميل مفرط أو غير معقول على البنية الأساسية للموقع.', 'Take any action that places an excessive or unreasonable load on the website infrastructure.'],
          ['الحصول أو محاولة الحصول على الوصول غير المسموح للموقع، بما في ذلك الوصول من خلال كلمة مرور أو رقم تعريف شخصي زائفين أو محاولة تحريف هويتك أو سلطة القيام بأي إجراء نيابة عن شخص آخر.', 'Gain, or attempt to gain, unauthorised access to the website, including by using a false password or personal identification number, misrepresenting your identity, or claiming authority to act on behalf of another person.'],
        ]),
      ],
    },
    {
      id: 'obligations', title: { ar: 'الالتزامات', en: 'Obligations' },
      blocks: [list([
        ['إنك تتحمل المسؤولية عن محتوى أي مادة يتم توزيعها من قبلك من خلال بوابة بلدية ظفار الإلكترونية، وإنك تتحمل المسؤولية عن جميع الالتزامات الناشئة عن استخدامك لبوابة بلدية ظفار الإلكترونية.', 'You are responsible for the content of any material you distribute through the Dhofar Municipality e-portal, and for all obligations arising from your use of it.'],
        ['إننا نحتفظ بالحق في حذف أي معلومات نعتبرها انتهاكاً لأي من شروط المستخدم دون إشعار و/أو توفير مثل تلك المعلومات.', 'We reserve the right to remove, without notice, any information we consider to breach any of these user terms.'],
        ['إننا لا نتحمل المسؤولية عن أي خسارة في الأرباح أو أي خسارة استتباعية أو اقتصادية من أي نوع نتيجة للمعلومات أو الخدمات التي نقوم بتقديمها.', 'We are not liable for any loss of profit or any consequential or economic loss of any kind resulting from the information or services we provide.'],
      ])],
    },
    {
      id: 'ip', title: { ar: 'حقوق الملكية الفكرية', en: 'Intellectual property' },
      blocks: [list([
        ['إن تصميم الموقع وما يحتويه من صور وشعارات هو ملك لبلدية ظفار، ولا يحق لأي جهة أو أي فرد استخدامها بأي شكل من الأشكال.', 'The website design and the images and logos it contains are the property of Dhofar Municipality and may not be used by any entity or individual in any form.'],
        ['يمكنك طباعة وتحميل أجزاء من المواد التي تحتويها بوابة بلدية ظفار الإلكترونية للاستخدام غير التجاري شريطة الإبقاء على إشعار حقوق النشر والحقوق الأخرى التي تظهر على تلك النسخ، وأي طريقة أخرى للنسخ أو إعادة التوزيع أو النشر أو الإرسال لأي جزء من المواد المتوفرة على البوابة تعتبر محظورة بشدة دون موافقة خطية صريحة.', 'You may print and download parts of the material on the e-portal for non-commercial use, provided that the copyright and other notices on those copies are kept. Any other copying, redistribution, publication or transmission of any part of the material is strictly prohibited without express written consent.'],
        ['وإنك توافق على عدم تغيير أو حذف أي إشعارات تخص الملكية من أي مواد منسوخة من بوابة بلدية ظفار الإلكترونية.', 'You agree not to change or remove any ownership notices from material copied from the e-portal.'],
      ])],
    },
    {
      id: 'viruses', title: { ar: 'الفيروسات', en: 'Viruses' },
      blocks: [
        p('نسعى دائماً لتحديث ما لدينا من برامج مكافحة الفيروسات، إلا أننا لا نضمن خلو الموقع أو خوادمه أو ملفاته القابلة للتحميل أو رسائل البريد الإلكتروني التي نرسلها من الفيروسات أو غيرها من المكونات الضارة، وننصح الزائر باستخدام البرامج الخاصة بالحماية من الفيروسات لفحص أي من المعلومات والملفات التي قد يحملها من شبكة الإنترنت.',
          'We always keep our antivirus software up to date, but we do not guarantee that the website, its servers, downloadable files or the emails we send are free of viruses or other harmful components. We recommend that visitors use antivirus software to scan any information and files they download from the internet.'),
        p('يجب عليك ألا:', 'You must not:'),
        list([
          ['تُدخل أو تحاول إدخال أي فيروس أو غيره من المكونات الضارة إلى الموقع أو إلى أي من برامجه أو أنظمته.', 'Introduce, or attempt to introduce, any virus or other harmful component into the website or any of its software or systems.'],
          ['تحاول بأي طريقة من الطرق الوصول إلى أي جزء من الموقع أو برامجه أو نظامه أو محاولة تغييرها أو إلغاء تجميعها أو إجراء هندسة عكسية لها أو تدميرها أو العبث بها على أي نحو كان.', 'Attempt in any way to access any part of the website, its software or systems, or to alter, decompile, reverse-engineer, destroy or tamper with them in any way.'],
        ]),
      ],
    },
    {
      id: 'links', title: { ar: 'الربط بمواقع أخرى', en: 'Links to other websites' },
      blocks: [p('قد تحتوي بوابة بلدية ظفار على وصلات ارتباط بمواقع طرف ثالث ليس ضمن سيطرتنا، ونحن نقوم بتوفير مثل هذه الروابط فقط بغرض التسهيل، ولا نصادق ولا نتحمل المسؤولية عن محتويات أي موقع يرتبط بموقعنا بواسطة وصلة ارتباط أو أي موقع نرتبط به بواسطة موقع مرتبط بنا.',
        'The e-portal may contain links to third-party websites outside our control. We provide these links only for convenience; we do not endorse, and are not responsible for, the content of any website linked to or from our website.')],
    },
    {
      id: 'contact', title: { ar: 'معلومات الاتصال', en: 'Contact information' },
      blocks: [
        p('ترحب بلدية ظفار بتعليقاتكم حول بيان الخصوصية أو حول أي غرض آخر، وعليه يرجى التفضل بإرسال أية استفسارات أو تعليقات إلى:', 'Dhofar Municipality welcomes your comments on this statement or on any other matter. Please send any questions or comments to:'),
        { type: 'contact', items: [{ kind: 'email', value: CONTACT.itsEmail, label: { ar: 'البريد الإلكتروني', en: 'Email' } }] },
      ],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  icon: 'ShieldCheck',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'السياسة والخصوصية', en: 'Privacy Policy' },
  intro: {
    ar: 'تثمّن البوابة ثقة زائري الموقع الإلكتروني وإيمانهم بما تقدمه، وتكفل لهم حفظ خصوصية معلوماتهم.',
    en: 'The portal values the trust of its visitors and guarantees the privacy of their information.',
  },
  sections: [
    {
      id: 'policy', title: { ar: '1. سياسة الخصوصية', en: '1. Privacy policy' },
      blocks: [p('تدير بلدية ظفار موقع البوابة الرسمية للخدمات البلدية الإلكترونية www.edm.gov.om، ويحق للبلدية أن تضيف لمضمون هذه السياسة وتحذف منها أو تعدلها متى ما أرادت دون الحاجة إلى إشعار مسبق.',
        'Dhofar Municipality operates the official municipal e-services portal, www.edm.gov.om. The municipality may add to, remove from or amend this policy at any time without prior notice.')],
    },
    {
      id: 'collection', title: { ar: '2. جمع المعلومات', en: '2. Collecting information' },
      blocks: [
        p('لا يقوم الموقع بجمع أية معلومات شخصية ما لم تقدم إلينا طواعية عبر المشاركة في أي نشاط يتطلب من الزائر معلومات شخصية، وسيقوم الموقع بجمع البيانات الشخصية الضرورية عند طلب الزائر أية خدمات أو معلومات من الموقع.',
          'The website does not collect any personal information unless you provide it voluntarily by taking part in an activity that requires it. The website collects the personal data needed when a visitor requests a service or information.'),
        p('ويُقصد بالبيانات الشخصية المعلومات التي ترد حول أي مستخدم معرّف أو قابل للتعريف في البوابة، وهذه المعلومات هي ذاتها التي تُطلب من الفرد عند زيارته لإحدى الدوائر الحكومية مثل الاسم أو العنوان أو رقم الهاتف.',
          'Personal data means information about any identified or identifiable user of the portal — the same information an individual is asked for when visiting a government office, such as name, address or phone number.'),
        p('من جانب آخر، يجمع الموقع معلومات للأغراض الإحصائية مثل اسم جهاز الحاسب الآلي، ونوع المتصفح، واسم مزود الخدمة، وتاريخ الزيارة، وصفحات الموقع التي زارها الفرد وعنوان الموقع الذي زاره سابقاً. وتسهم هذه المعلومات في معرفة كيفية استخدام الجمهور للموقع الإلكتروني وبالتالي نستطيع تحسين الخدمات باستمرار، ولا تتمحور المعلومات التي يتم جمعها حول مستخدم محدد ممن يتصفحون موقع البوابة، ولا تستهدف أيضاً تتبع تحركات أي مستخدم على الإطلاق.',
          'The website also collects statistical information such as computer name, browser type, service provider, visit date, pages visited and the previously visited website. This helps us understand how the public uses the website so we can keep improving services. It is not centred on any specific user and is never used to track any user.'),
        p('وربما يُطلب من الزائر المشاركة طواعية وحسب رغبته في استطلاعات الرأي التي يقوم بها الموقع، ولن يؤثر عدم المشاركة على استخدام الزائر لخصائص الموقع الإلكتروني وامتيازاته.',
          'Visitors may be invited to take part voluntarily in the website\'s opinion surveys; not taking part does not affect their use of the website\'s features.'),
      ],
    },
    {
      id: 'use', title: { ar: '3. استخدام المعلومات', en: '3. Using information' },
      blocks: [p('تستخدم «البوابة الرسمية للخدمات البلدية الإلكترونية» البيانات التي حصلت عليها لغرض الاستجابة لطلبات الخدمات على نحو مناسب، ويستفاد من تلك المعلومات لتلبية احتياجات الزائر مباشرة أو لتحسين الشبكة. وربما يحتفظ الموقع برسائلك الإلكترونية أو أية معلومات أخرى أو يبعث بها إلى المؤسسات الحكومية المعنية لغرض الاستجابة للطلبات ولتعزيز الخدمات التي تستخدم المعلومات الواردة في الاستطلاعات لخدمة الأغراض الموضوعة لها، ولن يتم استخدام تلك المعلومات أو نقلها إلى طرف ثالث (خارج الحكومة) بدون موافقة الزائر، ولن تستخدم لأية أغراض تجارية.',
        'The official municipal e-services portal uses the data it obtains to respond appropriately to service requests, to meet visitors\' needs directly or to improve the network. The website may keep your emails or other information, or send them to the relevant government bodies, in order to respond to requests and improve services. This information will not be used or passed to any third party (outside government) without the visitor\'s consent, and will not be used for any commercial purpose.')],
    },
    {
      id: 'retention', title: { ar: '4. حفظ المعلومات', en: '4. Keeping information' },
      blocks: [
        p('تحتفظ بلدية ظفار بالسجلات التي يُستفاد منها في دعم المهام الحكومية من خلال نظام حفظ الملفات والوثائق وفقاً للتخويل الخاص بعرض السجلات وبموجب موافقة «البوابة الرسمية للخدمات البلدية الإلكترونية». تحدد السجلات التي ترسل لهذا الموقع وتسجل وتحفظ وتؤمن طالما كانت هناك حاجة لاستخدامها لتلبية متطلبات تاريخية أو إدارية أو مالية أو قانونية.',
          'Dhofar Municipality keeps records that support government work in its file and document system, according to the records authority and with the approval of the portal. Records sent to this website are identified, logged, kept and secured for as long as they are needed for historical, administrative, financial or legal requirements.'),
        p('عندما يقوم المستخدم بإنشاء حساب فإنه يوافق على أنه لا يمكنه حذف الحساب من النظام وتبقى البيانات مسجلة لدى البلدية للرجوع إليها وقت الحاجة.',
          'By creating an account, the user agrees that the account cannot be deleted from the system and that its data remains on record with the municipality for reference when needed.'),
      ],
    },
    {
      id: 'cookies', title: { ar: '5. ملفات الارتباط', en: '5. Cookies' },
      blocks: [p('يمكن لأي من صفحات هذا الموقع أو تطبيقاته أن تستخدم ملفات الارتباط، وهذه الملفات هي ملفات صغيرة وقصيرة تُخزّن في القرص الصلب لجهاز الحاسب الآلي الخاص بالمستخدم، إذ تستخدم هذه الملفات لتتبع المعلومات التي تم تخزينها وتجنب المستخدم إعادة التزود بالمعلومات في كل مرة يستخدم فيها المواقع الإلكترونية، وبالنسبة للمعلومات التي تجمع بواسطة ملفات الارتباط في هذا الموقع فيتم التعامل معها بالطريقة ذاتها المتبعة مع المعلومات المستحصلة الأخرى. يمكنك إعداد متصفح الموقع لرفض هذه الملفات أو لتبليغك عند محاولة الموقع إرسال ملف ارتباط إليك، كما يمكنك فحص القرص الصلب والتخلص من هذه الملفات.',
        'Any page or application of this website may use cookies — small files stored on the user\'s computer that remember stored information so the user does not have to enter it again on every visit. Information collected through cookies is handled in the same way as other information we obtain. You can set your browser to refuse cookies or to warn you when a site tries to send one, and you can check your drive and delete them.')],
    },
    {
      id: 'security', title: { ar: '6. أمن الموقع الإلكتروني', en: '6. Website security' },
      blocks: [p('يلتزم موقع «البوابة الرسمية للخدمات البلدية الإلكترونية» بحماية المعلومات المتوفرة لديه أو التي يحصل عليها ويجمعها، ويتخذ الخطوات الكفيلة بأمن المعلومات، ومن بين هذه الخطوات التصديق والمراقبة والتدقيق والتشفير.',
        'The portal is committed to protecting the information it holds, obtains and collects, and takes the steps needed to secure it — including authentication, monitoring, auditing and encryption.')],
    },
  ],
};

export const PAYMENT_POLICY: LegalDoc = {
  slug: 'payment',
  icon: 'CreditCard',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'سياسة الدفع', en: 'Payment Policy' },
  intro: { ar: 'سياسة الدفع الإلكتروني والتسليم والإلغاء والاسترداد في خدمات بلدية ظفار.', en: 'Electronic payment, delivery, cancellation and refund policy for Dhofar Municipality services.' },
  sections: [
    {
      id: 'disclaimer', title: { ar: 'سياسة الدفع الإلكتروني – إشعار إخلاء المسؤولية', en: 'Electronic payment – disclaimer' },
      blocks: [list([
        ['توفر بلدية ظفار خدمة الدفع الإلكتروني للمستخدمين والمستفيدين من الخدمات الإلكترونية التي تقدمها البلدية عبر موقعها الإلكتروني على الشبكة المعلوماتية، وتجدر الإشارة بأن البلدية بذلت كل جهد ممكن لضمان توفر خدمة الدفع الإلكتروني وصلاحيتها للاستعمال في جميع الأوقات، وأنه ليست هناك ضمانات بأن تكون الخدمة متاحة باستمرار دون حدوث انقطاع أو توقف للنظام. كذلك تم بذل جهد لضمان سهولة الوصول إلى الخدمة، ولكن لا يمكن الجزم بأن استخدام خدمة الدفع الإلكتروني ستتوافق مع كل الأجهزة والبرمجيات من قبل مستخدميها.',
          'Dhofar Municipality offers electronic payment to users of its e-services through its website. The municipality has made every effort to keep the payment service available and usable at all times, but there is no guarantee that it will always be available without interruption. Efforts have also been made to keep the service accessible, but it cannot be guaranteed to work with every device and software.'],
        ['كذلك بلدية ظفار تحتفظ بحقوقها في تعليق أو سحب صلاحية الدخول كلياً أو جزئياً دون سابق إنذار لأي سبب من الأسباب. ويجب التنويه بأن البلدية لا تتحمل أي مسؤولية عن محتوى المواقع الخارجية والموجودة روابطها الإلكترونية ضمن موقع البلدية، وإن كان المستخدم قد تمكن من الدخول إليها فإنه يكون المسؤول شخصياً عن ذلك.',
          'Dhofar Municipality also reserves the right to suspend or withdraw access, fully or partly, without notice and for any reason. The municipality is not responsible for the content of external websites linked from its website; users who access them do so at their own responsibility.'],
      ])],
    },
    {
      id: 'delivery', title: { ar: 'سياسة التسليم', en: 'Delivery policy' },
      blocks: [p('خاصية الدفع الآلي هي خدمة إلكترونية عبر الموقع الإلكتروني www.edm.gov.om، وعند قيامك بعملية الدفع بنجاح سوف تصلك رسالة للتأكيد عن نجاح عملية الدفع من خلال الرسائل النصية القصيرة أو البريد الإلكتروني.',
        'Automatic payment is an electronic service on www.edm.gov.om. When your payment succeeds you will receive a confirmation by SMS or email.')],
    },
    {
      id: 'refund', title: { ar: 'سياسة الإلغاء والاسترداد', en: 'Cancellation & refund policy' },
      blocks: [
        list([['في حالة خصم المبلغ على المعاملة أكثر من مرة، يحق للعميل استرجاع المبلغ المحصّل بالزيادة.', 'If a transaction is charged more than once, the customer is entitled to a refund of the amount overcharged.']]),
        p('ويمكن التواصل مع بلدية ظفار عن طريق البريد الإلكتروني التالي مع إرفاق المستندات التالية:', 'Contact Dhofar Municipality by email with the following documents attached:'),
        { type: 'contact', items: [{ kind: 'email', value: CONTACT.infoEmail, label: { ar: 'البريد الإلكتروني', en: 'Email' } }] },
        list([
          ['كشف الحساب البنكي للعميل يوضح عمليات الخصم المتكررة.', 'A bank statement showing the repeated charges.'],
          ['إثبات الدفع المستلم عن طريق البريد الإلكتروني (إيصال المعاملة).', 'The proof of payment received by email (transaction receipt).'],
          ['نسخة من المعاملة.', 'A copy of the transaction.'],
        ], true),
        p('ويجب أخذ الاعتبارات التالية عند عملية الاسترجاع:', 'The following apply to refunds:'),
        list([
          ['يتم إرجاع المبلغ المستحق للعميل لنفس حساب البطاقة التي تم الخصم منها دون اعتبار لصاحب المعاملة في حالة عدم المطابقة.', 'The amount due is returned to the same card account that was charged, regardless of the transaction owner if they differ.'],
          ['يتم إرجاع المبلغ للعميل في مدة أقصاها أسبوع من تاريخ المعاملة.', 'The amount is refunded within one week of the transaction date at most.'],
          ['يتم إشعار العميل بأحقية استرجاع المبلغ خلال فترة 48 ساعة من عملية الدفع مع مراعاة الفترة الزمنية لإجراءات وسياسات الاسترداد من قبل البنوك المحلية.', 'The customer is notified of refund eligibility within 48 hours of the payment, subject to local banks\' refund procedures and timelines.'],
        ]),
      ],
    },
  ],
};

export const SERVICE_CONTROLS: LegalDoc = {
  slug: 'service-controls',
  icon: 'ListChecks',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'ضوابط الخدمات', en: 'Service Controls' },
  intro: {
    ar: 'إطلاق بوابة خدمات بلدية ظفار الإلكترونية: سعياً من بلدية ظفار لتسهيل إتمام معاملاتكم بكل مهنية وسهولة، باستخدام التصديق الإلكتروني والدفع الإلكتروني، تقدم البلدية مجموعة متكاملة من الخدمات الإلكترونية لخدمة شرائح مختلفة من المستفيدين.',
    en: 'Launch of the Dhofar Municipality e-services portal: to make completing your transactions professional and easy, using electronic authentication and electronic payment, the municipality offers an integrated set of e-services for different groups of beneficiaries.',
  },
  sections: [
    {
      id: 'overview', title: { ar: 'الخدمات التي توفرها بوابة خدمات بلدية ظفار', en: 'Services offered by the portal' },
      blocks: [
        p('1. تراخيص إباحة ورقابة البناء (الخرائط والاعتمادات):', '1. Building permits and building control (maps and approvals):'),
        list([
          ['مراجعة الأعمال وإدارة الشركة كمكتب استشاري.', 'Review work and manage the company as a consulting office.'],
          ['تسجيل البيانات المتعلقة بالاستشاري.', 'Register the consultant\'s data.'],
          ['المتابعة كمهندس استشاري لتسجيل بيانات المشروع والمرفقات والخرائط المطلوبة.', 'Follow up as a consulting engineer to register project data, attachments and required maps.'],
          ['معرفة حالة المشروع القائم أو المتابعة كمالك للمشروع.', 'Check the status of an existing project or follow up as the project owner.'],
          ['الاستفادة من خدمات رقابة البناء: الحصول على (الشروع بالعمل، استمارة إدخال خدمة الكهرباء أو المياه، شهادة إتمام البناء، تقرير فني، استمارة وضع علامات مساحية، طلب تمديد مسار كابلات).', 'Use building-control services: obtain a work-start permit, electricity or water connection form, building completion certificate, technical report, survey-marker form, or cable-route extension request.'],
          ['الاستعلام عن حالة المعاملة.', 'Enquire about the transaction status.'],
        ]),
        p('2. عقود الإيجار والترخيص البلدي:', '2. Lease contracts and municipal licensing:'),
        list([
          ['إصدار أو تجديد أو إلغاء عقود الإيجار.', 'Issue, renew or cancel lease contracts.'],
          ['الاطلاع على عقد الإيجار في أي وقت.', 'View the lease contract at any time.'],
          ['إصدار أو تجديد أو إلغاء التراخيص البلدية (الرقابة الغذائية، تنظيم الأسواق، الأنشطة التجارية المتنوعة، تصاريح السيارات، بطاقات العمال الصحية).', 'Issue, renew or cancel municipal licences (food control, market organisation, commercial activities, vehicle permits, workers\' health cards).'],
          ['معرفة حالة الطلب القائم أو المتابعة.', 'Check the status of an existing request or follow it up.'],
        ]),
      ],
    },
    {
      id: 'building', title: { ar: 'تراخيص إباحة ورقابة البناء (الخرائط والاعتمادات)', en: 'Building permits and control (maps and approvals)' },
      blocks: [
        p('كل ما عليك القيام به هو الدخول لتراخيص البناء بالموقع، وإجراء التصديق الإلكتروني والمتابعة كمكتب استشاري لمراجعة الأعمال وإدارة الشركة وتسجيل البيانات المتعلقة بالاستشاري أو المتابعة كمهندس استشاري لتسجيل بيانات المشروع والمرفقات والخرائط المطلوبة ومعرفة حالة المشروع القائم أو المتابعة كمالك للمشروع.',
          'All you need to do is open building permits on the website, complete electronic authentication, and continue as a consulting office (to review work, manage the company and register consultant data), as a consulting engineer (to register project data, attachments and maps), or as a project owner (to check an existing project).'),
        p('والاستفادة من خدمات رقابة البناء وهي: الحصول على (الشروع بالعمل، استمارة إدخال خدمة الكهرباء أو المياه، شهادة إتمام البناء، تقرير فني، استمارة وضع علامات مساحية، طلب تمديد مسار كابلات) والاستعلام عن حالة المعاملة، وإتمام عملية الدفع مباشرة بكل سهولة ويسر، واستلام نسخة مطبوعة من التراخيص والخرائط المعتمدة في أي وقت من خلال الموقع الإلكتروني.',
          'You can also use building-control services — work-start permit, electricity or water connection form, building completion certificate, technical report, survey-marker form, cable-route extension — enquire about the transaction, pay directly and easily, and print the approved permits and maps at any time from the website.'),
      ],
    },
    {
      id: 'leases', title: { ar: 'عقود الإيجار والترخيص البلدي', en: 'Lease contracts and municipal licensing' },
      blocks: [
        p('يمكنك الاستفادة من خدمات نظام عقود الإيجار، وهي (إصدار أو تجديد أو إلغاء عقود الإيجار):', 'You can use the lease-contract system to issue, renew or cancel lease contracts:'),
        list([
          ['فور استكمال البيانات المطلوبة سيتم إرسال رسالة نصية للطرف الثاني للدخول على النظام والموافقة على بيانات العقد المسجلة.', 'Once the required data is complete, an SMS is sent to the second party to sign in and approve the registered contract data.'],
          ['في حالة وجود أي ملاحظات سيصلك إشعار بذلك، وتأكد دائماً من صحة بياناتك المرفقة.', 'If there are any remarks you will be notified — always make sure your attached data is correct.'],
          ['بعد الموافقة على بيانات العقد من خلال القسم المختص، تابع عملية الدفع الإلكترونية فور استلامك لرسالة قبول الطلب.', 'After the competent section approves the contract data, complete the electronic payment as soon as you receive the acceptance message.'],
          ['واستلم نسخة مطبوعة ومعتمدة من عقد الإيجار كما يمكنك الاطلاع عليها في أي وقت.', 'Receive a printed, certified copy of the lease, which you can also view at any time.'],
        ], true),
        p('ويمكن للمستأجر طباعة العقود الخاصة به من خلال الدخول للنظام عن طريق التصديق الإلكتروني في أي وقت، كما يمكنه إصدار أو تجديد أو إلغاء التراخيص البلدية في مجالات الرقابة الغذائية أو تنظيم الأسواق والأنشطة التجارية المتنوعة وتصاريح السيارات وبطاقات العمال الصحية، وفور استكمال البيانات المطلوبة واستلام رسالة قبول الطلب يمكنه متابعة عملية الدفع الإلكتروني وطباعة الترخيص.',
          'Tenants can print their contracts at any time by signing in with electronic authentication. They can also issue, renew or cancel municipal licences for food control, markets and commercial activities, vehicle permits and workers\' health cards; once the data is complete and the acceptance message arrives, they can pay electronically and print the licence.'),
        { type: 'note', tone: 'info', text: { ar: 'نسعى لإحداث نقلة نوعية متميزة في كافة مجالات العمل البلدي وتقديم خدماتنا بطريقة أفضل.', en: 'We aim to bring a real step change to every area of municipal work and to deliver our services better.' } },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* SLA                                                                 */
/* ------------------------------------------------------------------ */

export const SLA_DOC: LegalDoc = {
  slug: 'sla',
  icon: 'Handshake',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'اتفاقية مستوى تقديم الخدمات الإلكترونية', en: 'E-Services Level Agreement' },
  intro: { ar: 'التزام بلدية ظفار بجودة الخدمات الرقمية ومدد إنجازها وقنوات الدعم.', en: 'Dhofar Municipality\'s commitment to digital service quality, completion times and support channels.' },
  sections: [
    {
      id: 'agreement', title: { ar: 'اتفاقية مستوى الخدمات الإلكترونية', en: 'E-services level agreement' },
      blocks: [
        p('تحرص بلدية ظفار على الارتقاء بجودة خدماتها وتحقيق رضا المستفيدين من خلال توفير حزمة من الخدمات البلدية الإلكترونية عبر بواباتها الرقمية على مدار الساعة. وتحدد اتفاقية مستوى تقديم الخدمات الإطار العام للزمن المتوقع لإنجاز كل خدمة إلكترونية، مع التأكيد على أن المدة المحددة لا تشمل الفترات الإضافية المطلوبة لاستكمال أي مستندات أو بيانات ناقصة لم يتم تقديمها من قبل المستفيد عند الطلب.',
          'Dhofar Municipality works to raise service quality and beneficiary satisfaction by offering municipal e-services through its digital portals around the clock. This agreement sets the expected time to complete each e-service; the stated time does not include any extra time needed to complete documents or data the beneficiary did not provide with the request.'),
        p('كما أن الاتفاقية لا تشمل الوقت المستغرق لمعالجة الطلبات التي تتطلب مراجعة أو إجراء من جهات حكومية أخرى عند الحاجة، أو في حال حدوث توقف في تكامل الأنظمة الإلكترونية مع تلك الجهات. وتلتزم بلدية ظفار ببذل أقصى الجهود لضمان استمرارية تقديم الخدمات بكفاءة، والعمل على تطويرها بما يلبي تطلعات المستفيدين من خدماتها.',
          'The agreement also excludes time taken for requests that need review or action by other government bodies, or when integration with those bodies\' systems is interrupted. The municipality is committed to doing its utmost to keep services running efficiently and to improving them to meet beneficiaries\' expectations.'),
      ],
    },
    {
      id: 'support', title: { ar: 'المساعدة والدعم', en: 'Help and support' },
      blocks: [
        p('توفر بلدية ظفار قنوات تقديم الدعم والمساعدة والاستجابة لطلبات الاستفسارات الواردة من المستفيدين من خلال:', 'Dhofar Municipality provides support and answers enquiries through:'),
        { type: 'contact', items: [
          { kind: 'phone', value: CONTACT.callCenter, label: { ar: 'مركز الاتصال', en: 'Call centre' } },
          { kind: 'whatsapp', value: CONTACT.whatsapp, label: { ar: 'خدمة الرد عبر واتساب', en: 'WhatsApp service' } },
        ] },
      ],
    },
    {
      id: 'privacy', title: { ar: 'الخصوصية وسرية المعلومات', en: 'Privacy and confidentiality' },
      blocks: [
        p('تلتزم بلدية ظفار بالحفاظ على خصوصية وسرية المعلومات والبيانات التي يقدمها المستفيدون عند استخدامهم للخدمات الإلكترونية المتاحة عبر المنصات الرقمية للبلدية، وتُستخدم هذه المعلومات فقط لأغراض تقديم الخدمات وتحسينها، وفقاً للأنظمة والسياسات المعمول بها في سلطنة عمان.',
          'The municipality keeps the information and data beneficiaries provide through its digital platforms private and confidential, and uses it only to deliver and improve services, in line with the regulations and policies of the Sultanate of Oman.'),
        p('وتؤكد البلدية أنها تتخذ كافة الإجراءات التقنية والتنظيمية اللازمة لضمان حماية البيانات من الوصول غير المصرح به أو استخدامها أو الإفصاح عنها، كما تلتزم بعدم مشاركة أو تبادل أي معلومات شخصية مع أي طرف ثالث دون الحصول على موافقة صريحة من المستفيد، إلا إذا تطلب الأمر ذلك بموجب القوانين واللوائح النافذة.',
          'The municipality takes all necessary technical and organisational measures to protect data from unauthorised access, use or disclosure, and will not share personal information with any third party without the beneficiary\'s explicit consent, unless required by law.'),
      ],
    },
  ],
};

export interface SlaService { nameAr: string; nameEn: string; durationAr: string; durationEn: string }

/** Transcribed from the municipality's SLA page. Every service: available 24/7, technical support via digital channels. */
export const SLA_SERVICES: SlaService[] = [
  { nameAr: 'توصيل تيار كهربائي مؤقت', nameEn: 'Temporary electricity connection', durationAr: '3 أيام عمل', durationEn: '3 working days' },
  { nameAr: 'طلب سيارة تكريم الموتى', nameEn: 'Hearse request', durationAr: '1 – 5 ساعات عمل', durationEn: '1–5 working hours' },
  { nameAr: 'شهادة دفن', nameEn: 'Burial certificate', durationAr: '15 – 30 دقيقة', durationEn: '15–30 minutes' },
  { nameAr: 'مكافحة الحشرات والقوارض وآفات الصحة العامة', nameEn: 'Insect, rodent and public-health pest control', durationAr: '1 – 3 أيام عمل', durationEn: '1–3 working days' },
  { nameAr: 'إصدار تراخيص سيارات نقل مياه صالحة للشرب', nameEn: 'Licences for drinking-water tankers', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'إصدار تراخيص سيارة نقل مياه غير صالحة للشرب', nameEn: 'Licences for non-drinking-water tankers', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'تراخيص مؤقتة لفصل الخريف', nameEn: 'Temporary Khareef-season licences', durationAr: '1 – 3 أيام عمل', durationEn: '1–3 working days' },
  { nameAr: 'تراخيص عرض ترويجي لسيارات', nameEn: 'Vehicle promotional display licences', durationAr: '30 – 45 دقيقة', durationEn: '30–45 minutes' },
  { nameAr: 'طلب الحصول على المصادقة النهائية ورخصة الحفر على مسارات تمديدات الخدمات العامة', nameEn: 'Final approval and excavation licence for public-utility routes', durationAr: '3 – 5 أيام عمل', durationEn: '3–5 working days' },
  { nameAr: 'طلب الحصول على تصديق البلدية لمسارات تمديدات خدمات الكهرباء (التوصيلات المنزلية)', nameEn: 'Municipal approval of electricity routes (house connections)', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'تقرير لإخلاء طرف المقاولين', nameEn: 'Contractor clearance report', durationAr: '7 أيام عمل', durationEn: '7 working days' },
  { nameAr: 'طلب استخراج تصاريح ناقلات صهاريج مياه الصرف الصحي', nameEn: 'Sewage tanker truck permits', durationAr: 'ساعتان', durationEn: '2 hours' },
  { nameAr: 'تسجيل طلبات المراجعين (بلدية ظفار)', nameEn: 'Visitor request registration', durationAr: '5 – 10 دقائق', durationEn: '5–10 minutes' },
  { nameAr: 'خدمة توصيل عداد مياه للمبنى', nameEn: 'Building water meter connection', durationAr: 'يوما عمل', durationEn: '2 working days' },
  { nameAr: 'رخصة بناء كبرى (محطة وقود)', nameEn: 'Major building permit (fuel station)', durationAr: '5 أيام عمل', durationEn: '5 working days' },
  { nameAr: 'رخصة بناء صغرى (أبراج تقوية الإرسال)', nameEn: 'Minor building permit (signal towers)', durationAr: '5 أيام عمل', durationEn: '5 working days' },
  { nameAr: 'ترخيص بناء صغرى (هدم)', nameEn: 'Minor building permit (demolition)', durationAr: 'يوم إلى يومين', durationEn: '1–2 days' },
  { nameAr: 'رخصة بناء صغرى (تسوير)', nameEn: 'Minor building permit (fencing)', durationAr: 'فترة الدوام الرسمي', durationEn: 'Within official working hours' },
  { nameAr: 'رخصة بناء صغرى (ترميم)', nameEn: 'Minor building permit (renovation)', durationAr: '5 أيام عمل', durationEn: '5 working days' },
  { nameAr: 'رخصة بناء صغرى (محطة توزيع الكهرباء)', nameEn: 'Minor building permit (electricity substation)', durationAr: '5 أيام عمل', durationEn: '5 working days' },
  { nameAr: 'خدمة تأكيد وجود العلامات المساحية لموقع قطعة الأرض', nameEn: 'Confirmation of survey markers for a plot', durationAr: 'يوما عمل', durationEn: '2 working days' },
  { nameAr: 'خدمة تقرير فني لمبنى قائم أو أرض فضاء', nameEn: 'Technical report for an existing building or vacant land', durationAr: '3 أيام عمل', durationEn: '3 working days' },
  { nameAr: 'خدمة الشروع في العمل (بدء تنفيذ المشروع)', nameEn: 'Work-start permit (project start)', durationAr: '3 أيام عمل', durationEn: '3 working days' },
  { nameAr: 'خدمة شهادة إتمام للمبنى', nameEn: 'Building completion certificate', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'إدارة استثمار موقع', nameEn: 'Site investment management', durationAr: '30 يوم عمل', durationEn: '30 working days' },
  { nameAr: 'توثيق عقد الإيجار (سكني أو تجاري أو صناعي)', nameEn: 'Lease contract registration (residential, commercial or industrial)', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'تحصيل مبالغ التأمينات وإعادتها', nameEn: 'Collection and refund of insurance deposits', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'طلب إصدار أمر العمل للمشروع', nameEn: 'Project work-order request', durationAr: '2 – 3 أيام عمل', durationEn: '2–3 working days' },
  { nameAr: 'طلب اعتماد معبر قائم أو قطع أو ثقب الشارع لتوصيل الخدمات', nameEn: 'Approval of an existing crossing, or road cutting/boring for utility connection', durationAr: '1 – 5 أيام عمل', durationEn: '1–5 working days' },
  { nameAr: 'تجديد تراخيص سيارات صالحة للشرب', nameEn: 'Renewal of drinking-water tanker licences', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'تجديد تراخيص سيارة نقل مياه غير صالحة للشرب', nameEn: 'Renewal of non-drinking-water tanker licences', durationAr: 'يوم عمل', durationEn: '1 working day' },
  { nameAr: 'طلب إزالة الحشائش والمشوهات في المواقع العامة', nameEn: 'Removal of weeds and eyesores in public places', durationAr: '1 – 7 أيام عمل', durationEn: '1–7 working days' },
];

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

export interface Faq { q: Bi; a: Bi; category: FaqCategory }
export type FaqCategory = 'general' | 'account' | 'requests' | 'payment' | 'support';

export const FAQ_CATEGORIES: { id: FaqCategory; ar: string; en: string; icon: string }[] = [
  { id: 'general', ar: 'عام', en: 'General', icon: 'Info' },
  { id: 'account', ar: 'الحساب والدخول', en: 'Account & sign-in', icon: 'Fingerprint' },
  { id: 'requests', ar: 'تقديم الطلبات ومتابعتها', en: 'Requests', icon: 'FileText' },
  { id: 'payment', ar: 'الدفع والاسترداد', en: 'Payment & refunds', icon: 'CreditCard' },
  { id: 'support', ar: 'الدعم والنفاذ الرقمي', en: 'Support & accessibility', icon: 'LifeBuoy' },
];

const faq = (category: FaqCategory, qAr: string, qEn: string, aAr: string, aEn: string): Faq => ({ category, q: { ar: qAr, en: qEn }, a: { ar: aAr, en: aEn } });

export const FAQS: Faq[] = [
  // From the current website
  faq('requests', 'كيف أستطيع التقدم على طلب؟', 'How do I apply for a service?',
    'اختر الخدمة التي تريدها من دليل الخدمات، ثم اضغط «التقديم على الخدمة». لا بد من استيفاء جميع المتطلبات لمتابعة التقديم.',
    'Choose the service from the service catalogue, then press "Apply". All requirements must be met to continue.'),
  faq('account', 'ما الغرض من التسجيل الإلكتروني بالبلدية؟', 'Why register electronically with the municipality?',
    'بعد التسجيل يمكن للمستخدم الدخول إلى جميع الخدمات الإلكترونية التي تقدمها البلدية والتقديم عليها من أي مكان.',
    'Once registered you can access and apply for all of the municipality\'s e-services from anywhere.'),
  faq('support', 'هل هناك محادثة فورية على هذا الموقع؟', 'Is there live chat on this website?',
    'نعم، يمكنك إجراء محادثة مباشرة مع القسم المختص.', 'Yes, you can chat directly with the competent section.'),
  faq('requests', 'هل يمكنني بدء الخدمة الإلكترونية وحفظها حتى أتمكن من متابعتها لاحقاً؟', 'Can I start a service, save it and continue later?',
    'نعم تستطيع. من الممكن بدء استخدام خدمة إلكترونية وحفظها وإنهاؤها لاحقاً.', 'Yes. You can start an e-service, save it and finish it later.'),
  // Added for the new portal
  faq('account', 'كيف أسجل الدخول إلى البوابة؟', 'How do I sign in to the portal?',
    'يتم الدخول عبر «ثقة» (الهوية الرقمية الوطنية). تُجلب بياناتك الشخصية ورقمك المدني تلقائياً ولا تحتاج إلى إنشاء كلمة مرور خاصة بالبوابة.',
    'Sign in with Thiqa, the national digital identity. Your personal details and civil number are fetched automatically, so you do not need a separate portal password.'),
  faq('account', 'هل أحتاج إلى إرفاق البطاقة الشخصية أو السجل التجاري مع الطلب؟', 'Do I need to attach my ID card or commercial registration?',
    'لا. بياناتك الشخصية تُجلب من «ثقة»، والسجل التجاري يُربط بإدخال رقمه فقط وتُسترجع بيانات المنشأة تلقائياً، فلا يُطلب منك إرفاق أي منهما.',
    'No. Your personal data comes from Thiqa, and your commercial registration is linked just by entering its number — the company data is retrieved automatically, so neither needs to be attached.'),
  faq('account', 'كيف أقدم طلباً باسم منشأتي التجارية؟', 'How do I apply on behalf of my company?',
    'أثناء تقديم الطلب أدخل رقم السجل التجاري في الخطوة المخصصة لذلك، وسيتحقق النظام من الرقم ويربط الطلب بالمنشأة.',
    'While applying, enter the commercial registration number in the relevant step; the system checks it and links the request to your company.'),
  faq('requests', 'ما خطوات تقديم الطلب في البوابة الجديدة؟', 'What are the steps to apply in the new portal?',
    'ثلاث خطوات: الاطلاع على شروط الخدمة والموافقة عليها، ثم تأكيد المستندات المطلوبة (تُجلب من خزنتك الرقمية إن توفرت)، ثم تعبئة النموذج وإرساله.',
    'Three steps: read and accept the service conditions, confirm the required documents (fetched from your digital vault where available), then fill in the form and submit.'),
  faq('requests', 'كيف أتابع حالة طلبي؟', 'How do I track my request?',
    'تظهر حالة الطلب (قيد الانتظار، قيد المراجعة، معتمد، مرفوض) في حسابك، ويصلك إشعار بالرسائل النصية أو البريد الإلكتروني عند كل تغيير.',
    'Your account shows the request status (pending, in review, approved, rejected), and you are notified by SMS or email whenever it changes.'),
  faq('requests', 'ماذا يحدث إذا طُلبت مني معلومات إضافية؟', 'What if I am asked for more information?',
    'يُعاد الطلب إليك مع ملاحظات الموظف المختص. أكمل المعلومات أو المستندات المطلوبة وأعد إرسال الطلب ليستكمل مساره.',
    'The request is returned to you with the officer\'s notes. Provide the missing information or documents and resubmit so it can continue.'),
  faq('requests', 'كم تستغرق معالجة الطلب؟', 'How long does processing take?',
    'لكل خدمة مدة إنجاز محددة في «اتفاقية مستوى تقديم الخدمات». لا تشمل المدة الوقت اللازم لاستكمال مستندات ناقصة أو مراجعة جهات حكومية أخرى.',
    'Each service has a completion time listed in the Service Level Agreement. It excludes time spent completing missing documents or waiting for other government bodies.'),
  faq('requests', 'هل يمكنني سحب الطلب بعد تقديمه؟', 'Can I withdraw a request after submitting it?',
    'نعم، في الخدمات التي تسمح بذلك يمكنك سحب الطلب قبل اعتماده من صفحة الطلب.', 'Yes — for services that allow it, you can withdraw the request from its page before it is approved.'),
  faq('requests', 'كيف أتحقق من صحة شهادة أو تصريح صادر من البلدية؟', 'How can I verify a certificate or permit issued by the municipality?',
    'تصدر الشهادات والتصاريح موقّعة رقمياً مع رمز استجابة سريعة (QR)؛ امسح الرمز للتحقق من صحتها وبياناتها.',
    'Certificates and permits are digitally signed and carry a QR code; scan it to check they are genuine.'),
  faq('payment', 'ما طرق الدفع المتاحة؟', 'Which payment methods are available?',
    'الدفع عبر بوابة الدفع الإلكتروني، أو الخصم من رصيد المحفظة الإلكترونية حيثما يتوفر، وتصلك رسالة تأكيد بنجاح الدفع عبر الرسائل النصية أو البريد الإلكتروني.',
    'Pay through the electronic payment gateway or, where available, from your e-wallet balance. You receive a confirmation by SMS or email.'),
  faq('payment', 'تم خصم المبلغ أكثر من مرة، ماذا أفعل؟', 'I was charged more than once — what should I do?',
    'راسل info@dm.gov.om مرفقاً كشف الحساب البنكي وإيصال المعاملة ونسخة منها. يُعاد المبلغ الزائد إلى نفس البطاقة خلال أسبوع كحد أقصى.',
    'Email info@dm.gov.om with your bank statement, the transaction receipt and a copy of the transaction. The extra amount is returned to the same card within one week at most.'),
  faq('payment', 'كيف أسترد مبلغ التأمين؟', 'How do I get my insurance deposit back?',
    'بعد صدور شهادة الإنجاز يظهر خيار «طلب استرداد» في لوحة التحكم الخاصة بك، ويُحتسب المبلغ تلقائياً ويُرسل إليك إيصال الاسترداد.',
    'Once the completion certificate is issued, a "Refund request" option appears in your dashboard; the amount is calculated automatically and the refund receipt is sent to you.'),
  faq('support', 'كيف أتواصل مع البلدية؟', 'How do I contact the municipality?',
    'عبر مركز الاتصال 1771، أو خدمة الرد عبر واتساب على الرقم 91484042، أو البريد الإلكتروني info@dm.gov.om.',
    'Call centre 1771, WhatsApp 91484042, or email info@dm.gov.om.'),
  faq('support', 'كيف أقدم مقترحاً أو شكوى أو بلاغاً؟', 'How do I submit a suggestion, complaint or report?',
    'عبر المنصة الوطنية للمقترحات والشكاوى والبلاغات «تجاوب»، ويمكنك الوصول إليها من روابط التذييل.',
    'Through Tajawob, the national platform for suggestions, complaints and reports — it is linked in the footer.'),
  faq('support', 'هل البوابة ملائمة لذوي الإعاقة؟', 'Is the portal accessible to people with disabilities?',
    'نعم، صُممت وفق معايير WCAG 2.2 (المستوى AA)، وتوفر أدوات نفاذ من الزر العائم أو الاختصار Alt+A: تكبير النص، التباين العالي، الخط المقروء، دليل القراءة، القراءة الصوتية وغيرها.',
    'Yes. It is built to WCAG 2.2 level AA and offers accessibility tools from the floating button or Alt+A: larger text, high contrast, readable font, reading guide, read-aloud and more.'),
  faq('general', 'هل البوابة متاحة باللغة الإنجليزية؟', 'Is the portal available in English?',
    'نعم، جميع الصفحات والخدمات متاحة بالعربية والإنجليزية، ويمكنك التبديل من زر اللغة في أعلى الصفحة.', 'Yes. All pages and services are available in Arabic and English; switch with the language button at the top.'),
  faq('general', 'هل الخدمات متاحة على مدار الساعة؟', 'Are services available around the clock?',
    'نعم، الخدمات الإلكترونية متاحة 24/7، بينما تتم معالجة الطلبات خلال أيام وساعات العمل الرسمية وفق مدد الإنجاز المحددة.',
    'Yes, e-services are available 24/7; requests are processed on working days within the stated completion times.'),
  faq('general', 'كيف تُحمى بياناتي الشخصية؟', 'How is my personal data protected?',
    'تُستخدم بياناتك فقط لتقديم الخدمات وتحسينها ولا تُشارك مع أي طرف ثالث خارج الحكومة دون موافقتك. راجع «السياسة والخصوصية» للتفاصيل.',
    'Your data is used only to deliver and improve services and is never shared outside government without your consent. See the Privacy Policy for details.'),
];

/* ------------------------------------------------------------------ */
/* Other footer pages                                                  */
/* ------------------------------------------------------------------ */

export const ACCESSIBILITY_STATEMENT: LegalDoc = {
  slug: 'accessibility-statement',
  icon: 'Accessibility',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'بيان النفاذ الرقمي', en: 'Accessibility Statement' },
  intro: { ar: 'تلتزم بلدية ظفار بأن تكون بوابتها الإلكترونية متاحة وسهلة الاستخدام للجميع، بمن فيهم الأشخاص ذوو الإعاقة وكبار السن.', en: 'Dhofar Municipality is committed to making its e-portal accessible and easy to use for everyone, including people with disabilities and older adults.' },
  sections: [
    { id: 'standard', title: { ar: 'المعيار المعتمد', en: 'Standard' }, blocks: [p('تسعى البوابة إلى الامتثال لإرشادات إتاحة محتوى الويب WCAG 2.2 على المستوى AA، وتُراجع الصفحات والمكونات الجديدة وفق هذه الإرشادات قبل نشرها.', 'The portal aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA; new pages and components are checked against them before publishing.')] },
    { id: 'features', title: { ar: 'ميزات النفاذ المتوفرة', en: 'Accessibility features' }, blocks: [list([
      ['أدوات نفاذ متاحة في كل الصفحات من الزر العائم أو الاختصار Alt+A.', 'Accessibility tools on every page from the floating button or Alt+A.'],
      ['تكبير النص حتى 175% وتعديل ارتفاع السطر وتباعد الحروف والكلمات.', 'Text enlargement up to 175% plus line-height and letter/word spacing.'],
      ['أوضاع ألوان: تباين عالٍ، داكن، رمادي، ألوان هادئة أو قوية.', 'Colour modes: high contrast, dark, grayscale, soft or strong colours.'],
      ['خط مقروء، تمييز الروابط، مؤشر كبير، دليل وقناع القراءة، إخفاء الصور وإيقاف الحركة.', 'Readable font, highlighted links, big cursor, reading guide and mask, hide images and stop animations.'],
      ['القراءة الصوتية للصفحة أو للنص المحدد مع التحكم بالسرعة.', 'Read-aloud for the page or selected text with speed control.'],
      ['تنقل كامل بلوحة المفاتيح مع مؤشر تركيز واضح، ورابط «تخطي إلى المحتوى الرئيسي».', 'Full keyboard navigation with a visible focus indicator and a "skip to main content" link.'],
      ['دعم كامل للعربية والإنجليزية مع الاتجاه الصحيح لكل لغة، ونصوص بديلة للصور، وتسميات واضحة للحقول والأخطاء.', 'Full Arabic and English with correct direction, alt text for images, and clear labels for fields and errors.'],
    ])] },
    { id: 'limitations', title: { ar: 'القيود المعروفة', en: 'Known limitations' }, blocks: [p('قد لا تتوافق بعض المستندات القديمة بصيغة PDF أو المحتوى المقدّم من جهات خارجية مع المعيار بالكامل، ونعمل على تحسينها تدريجياً.', 'Some older PDF documents and third-party content may not fully conform; we are improving them progressively.')] },
    { id: 'feedback', title: { ar: 'التواصل والملاحظات', en: 'Feedback' }, blocks: [
      p('إذا واجهت أي صعوبة في الوصول إلى محتوى أو خدمة، يسعدنا تواصلك معنا وسنعمل على توفير المحتوى بصيغة مناسبة لك.', 'If you have difficulty accessing any content or service, please contact us and we will provide it in a suitable format.'),
      { type: 'contact', items: [
        { kind: 'phone', value: CONTACT.callCenter, label: { ar: 'مركز الاتصال', en: 'Call centre' } },
        { kind: 'email', value: CONTACT.infoEmail, label: { ar: 'البريد الإلكتروني', en: 'Email' } },
      ] },
    ] },
  ],
};

export const OPEN_DATA_LICENSE: LegalDoc = {
  slug: 'open-data',
  icon: 'Database',
  updated: SITE_LAST_UPDATED,
  title: { ar: 'رخصة البيانات المفتوحة', en: 'Open Data License' },
  intro: { ar: 'شروط إعادة استخدام البيانات المفتوحة التي تنشرها بلدية ظفار.', en: 'Terms for reusing the open data published by Dhofar Municipality.' },
  sections: [
    { id: 'rights', title: { ar: 'ما يُسمح به', en: 'What you may do' }, blocks: [list([
      ['نسخ البيانات ونشرها وتوزيعها ونقلها.', 'Copy, publish, distribute and transmit the data.'],
      ['تعديل البيانات ودمجها مع بيانات أخرى وإنتاج تحليلات وتطبيقات منها.', 'Adapt the data, combine it with other data, and build analyses and applications from it.'],
      ['استخدام البيانات للأغراض التجارية وغير التجارية.', 'Use the data for commercial and non-commercial purposes.'],
    ])] },
    { id: 'conditions', title: { ar: 'الشروط', en: 'Conditions' }, blocks: [list([
      ['الإشارة إلى المصدر: «بلدية ظفار – البيانات المفتوحة» مع رابط مجموعة البيانات حيثما أمكن.', 'Attribute the source: "Dhofar Municipality – Open Data", with a link to the dataset where possible.'],
      ['عدم الإيحاء بأن البلدية تؤيد استخدامك أو منتجك.', 'Do not suggest that the municipality endorses you or your use.'],
      ['عدم تحريف البيانات أو استخدامها بطريقة مضللة أو مخالفة للقوانين النافذة في سلطنة عمان.', 'Do not misrepresent the data or use it in a misleading way or against the laws of the Sultanate of Oman.'],
    ])] },
    { id: 'exclusions', title: { ar: 'ما لا تشمله الرخصة', en: 'Exclusions' }, blocks: [list([
      ['البيانات الشخصية وأي بيانات تمكّن من التعرف على الأفراد.', 'Personal data and any data that can identify individuals.'],
      ['شعارات البلدية وهويتها البصرية.', 'The municipality\'s logos and visual identity.'],
      ['المحتوى المملوك لأطراف ثالثة والمشار إليه صراحة.', 'Content owned by third parties and marked as such.'],
    ])] },
    { id: 'warranty', title: { ar: 'إخلاء المسؤولية', en: 'Disclaimer' }, blocks: [
      p('تُتاح البيانات «كما هي» دون أي ضمانات، ولا تتحمل البلدية مسؤولية أي خسارة تنتج عن استخدامها، وتحتفظ بحق تحديثها أو إيقاف نشرها.', 'Data is provided "as is" without warranty. The municipality is not liable for any loss arising from its use and may update or withdraw it.'),
      { type: 'note', tone: 'warning', text: { ar: 'نص مبدئي — يُستبدل بالنص الرسمي المعتمد للرخصة عند توفره.', en: 'Draft text — to be replaced by the officially approved licence text.' } },
    ] },
  ],
};

export const EXTERNAL_LINKS = {
  governor: { url: 'https://www.dhofar.gov.om', title: { ar: 'البوابة الرسمية لمحافظ ظفار', en: 'Official portal of the Governor of Dhofar' }, desc: { ar: 'الموقع الرسمي لمكتب محافظ ظفار: الأخبار والمشاريع والخدمات على مستوى المحافظة.', en: 'The official website of the Office of the Governor of Dhofar: news, projects and governorate services.' } },
  tajawob: { url: 'https://tajawob.om', title: { ar: 'المنصة الوطنية للمقترحات والشكاوى والبلاغات (تجاوب)', en: 'Tajawob — national platform for suggestions, complaints and reports' }, desc: { ar: 'قدّم مقترحك أو شكواك أو بلاغك لأي جهة حكومية وتابع معالجته عبر منصة وطنية موحدة.', en: 'Submit a suggestion, complaint or report to any government body and follow it up through one national platform.' } },
};

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms: TERMS, privacy: PRIVACY, payment: PAYMENT_POLICY, 'service-controls': SERVICE_CONTROLS,
  sla: SLA_DOC, 'accessibility-statement': ACCESSIBILITY_STATEMENT, 'open-data': OPEN_DATA_LICENSE,
};

/** Footer structure, mirroring the municipality website */
export const FOOTER_GROUPS: { id: 'legal' | 'services' | 'important'; title: Bi; links: { href: string; label: Bi; external?: boolean }[] }[] = [
  { id: 'legal', title: { ar: 'المعلومات القانونية', en: 'Legal information' }, links: [
    { href: '/terms', label: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' } },
    { href: '/privacy', label: { ar: 'السياسة والخصوصية', en: 'Privacy Policy' } },
    { href: '/payment', label: { ar: 'سياسة الدفع', en: 'Payment Policy' } },
    { href: '/open-data', label: { ar: 'رخصة البيانات المفتوحة', en: 'Open Data License' } },
  ] },
  { id: 'services', title: { ar: 'سياسات الخدمة', en: 'Service standards' }, links: [
    { href: '/faqs', label: { ar: 'الأسئلة الشائعة', en: 'FAQs' } },
    { href: '/service-controls', label: { ar: 'ضوابط الخدمات', en: 'Service Controls' } },
    { href: '/sla', label: { ar: 'اتفاقية مستوى تقديم الخدمات', en: 'Service Level Agreement' } },
    { href: '/accessibility-statement', label: { ar: 'بيان النفاذ الرقمي', en: 'Accessibility Statement' } },
  ] },
  { id: 'important', title: { ar: 'روابط هامة', en: 'Important links' }, links: [
    { href: '/governor-portal', label: { ar: 'البوابة الرسمية لمحافظ ظفار', en: 'Governor of Dhofar portal' } },
    { href: '/tajawoob', label: { ar: 'المنصة الوطنية للمقترحات والشكاوى والبلاغات (تجاوب)', en: 'Tajawob (suggestions & complaints)' } },
    { href: '/participation', label: { ar: 'المشاركة الرقمية', en: 'Digital participation' } },
    { href: '/identity', label: { ar: 'دليل الهوية البصرية', en: 'Visual identity guide' } },
    { href: '/sitemap', label: { ar: 'خريطة الموقع', en: 'Sitemap' } },
  ] },
];
