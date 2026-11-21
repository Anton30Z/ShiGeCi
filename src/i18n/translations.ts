import type { HskLevel, LanguageCode, TopicId } from '../types/vocab';

export interface TranslationDict {
  nav: {
    today: string;
    topics: string;
    vocabulary: string;
    writing: string;
    settings: string;
  };
  common: {
    offlineBanner: string;
    close: string;
    cancel: string;
    hskLevel: (level: number) => string;
    customWord: string;
    radical: string;
    daysUnit: string;
    wordsPerDay: string;
    toggleTheme: string;
  };
  dashboard: {
    newToday: string;
    dailyFocus: (levelsText: string, count: number) => string;
    goalCompleteTitle: string;
    cardsReadyTitle: (count: number) => string;
    goalCompleteDesc: string;
    cardsReadyDesc: (newCount: number, dueCount: number) => string;
    startSession: string;
    studyExtra: string;
    quickQuiz: string;
    tonesTrainer: string;
    radicalsLesson: string;
    cardLab: string;
    browseVocab: string;
    cardsDue: string;
    reviewedToday: (count: number) => string;
    studyStreak: string;
    lastStudy: (date: string) => string;
    startStreakHint: string;
    masteredWords: string;
    masteredRule: string;
    inProgress: string;
    totalTracked: string;
    curriculumTitle: string;
    noLevelsSelected: string;
    loadingLevel: (levelsText: string) => string;
    cachedLevel: (levelsText: string) => string;
    syncedLevel: (levelsText: string) => string;
    starterPackNote: (count: number) => string;
    syncButton: string;
    backupTitle: string;
    backupDesc: string;
    exportJson: string;
    importJson: string;
  };
  session: {
    exit: string;
    cardCounter: (current: number, total: number) => string;
    newWordBadge: string;
    reviewBadge: string;
    tones: string;
    pinyinToggle: string;
    pinyinHidden: string;
    flashcardTab: string;
    strokesTab: string;
    playNormal: string;
    playSlow: string;
    listenEnglish: string;
    revealAnswer: string;
    listenExample: string;
    prevWord: string;
    nextWord: string;
    finishPack: string;
    reviewAgain: string;
    startPackQuiz: string;
    fsrsHint: string;
    fsrsQuestion: string;
    backToCard: string;
    skipRating: string;
    reRateWord: string;
    ratedBadge: string;
    completeTitle: string;
    completeSummary: (count: number) => string;
    returnDashboard: string;
    grades: {
      Again: string;
      Hard: string;
      Good: string;
      Easy: string;
    };
    gradeDescs: {
      Again: string;
      Hard: string;
      Good: string;
      Easy: string;
    };
    toneLabels: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
  };
  canvas: {
    practiceDrawing: string;
    watchAnimation: string;
    outlineOn: string;
    outlineOff: string;
    hint: string;
    replay: string;
    reset: string;
    pronounce: string;
    loadingStrokes: string;
    loadError: (char: string) => string;
    noChars: (word: string) => string;
    completed: (mistakes: number) => string;
    strokeProgress: (done: number, total: number, mistakes: number) => string;
    watchHint: string;
    drawHint: string;
  };
  vocabulary: {
    title: string;
    subtitle: (levelsText: string, total: number, customCount: number) => string;
    addWord: string;
    searchPlaceholder: string;
    filterAll: (n: number) => string;
    filterNew: (n: number) => string;
    filterLearning: (n: number) => string;
    filterMastered: (n: number) => string;
    emptyTitle: string;
    emptyDesc: string;
    statusNew: string;
    statusLearning: string;
    statusMastered: string;
    showMore: (remaining: number) => string;
    meanings: string;
    reps: string;
    stability: string;
    lapses: string;
    slowAudio: string;
    practiceStrokes: string;
    addModalTitle: string;
    fieldHanzi: string;
    fieldHanziPlaceholder: string;
    fieldPinyin: string;
    fieldPinyinPlaceholder: string;
    fieldMeaning: string;
    fieldMeaningPlaceholder: string;
    fieldExample: string;
    fieldExamplePlaceholder: string;
    validationRequired: string;
    saveWord: string;
  };
  topics: {
    title: string;
    subtitle: (levelsText: string, totalWords: number, packSize: number) => string;
    packSizeLabel: string;
    packSizeOption: (n: number) => string;
    backToTopics: string;
    wordsAndPacks: (wordCount: number, packCount: number, packSize: number) => string;
    learnedProgress: (learned: number, total: number) => string;
    packTitle: (num: number) => string;
    packRange: (start: number, end: number, count: number) => string;
    studyPack: string;
    testPack: string;
    previewWords: string;
    hideWords: string;
    tonesBannerTitle: string;
    tonesBannerDesc: string;
    openTonesTrainer: string;
    radicalsBannerTitle: string;
    radicalsBannerDesc: string;
    radicalsCountLabel: string;
    radicalsAllOption: (total: number) => string;
    radicalsStudyBtn: (count: number) => string;
    radicalsTestBtn: string;
    radicalsShowList: string;
    radicalsHideList: string;
    emptyTitle: string;
    emptyDesc: string;
    names: Record<TopicId, { title: string; desc: string }>;
  };
  writing: {
    title: string;
    subtitleFallback: string;
    listen: string;
    inputLabel: string;
    inputPlaceholder: string;
    loadButton: string;
    quickPicks: (levelsText: string) => string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageTitle: string;
    languageDesc: string;
    dailyGoal: string;
    dailyGoalDesc: string;
    lightGoal: string;
    recommendedGoal: string;
    intensiveGoal: string;
    themeTitle: string;
    themeDesc: string;
    darkMode: string;
    lightMode: string;
    toneColorsTitle: string;
    toneColorsDesc: string;
    enabled: string;
    disabled: string;
    autoPlayTitle: string;
    autoPlayDesc: string;
    on: string;
    off: string;
    speechRateTitle: string;
    speechRateDesc: string;
    slowSpeed: string;
    normalSpeed: string;
    testVoice: string;
    testEnglishVoice: string;
    testPhrase: string;
    testEnglishPhrase: string;
    voiceSectionTitle: string;
    voiceSectionDesc: (total: number, localCount: number, networkCount: number, enCount: number) => string;
    voiceModeTitle: string;
    voiceModeDesc: string;
    voiceModeAuto: string;
    voiceModeLocal: string;
    voiceModeNetwork: string;
    voiceGenderTitle: string;
    voiceGenderDesc: string;
    voiceGenderAny: string;
    voiceGenderFemale: string;
    voiceGenderMale: string;
    voiceGenderUnknown: string;
    voiceListTitle: string;
    voiceAutoOption: string;
    voiceAutoDesc: string;
    voiceNoMatches: string;
    voiceNoMaleBrowserHint: string;
    voiceNoSystemVoices: string;
    voiceResetFilters: string;
    voicePreview: string;
    voiceLocalTag: string;
    voiceNetworkTag: string;
    offlineCacheTitle: string;
    offlineCacheSummary: (levelsText: string, charsCount: number) => string;
    starterPackOnly: string;
    exportBackup: string;
    restoreBackup: string;
    resetProgress: string;
    confirmReset: string;
  };
  pwa: {
    install: string;
    installApp: string;
    installIos: string;
    iosModalTitle: string;
    iosStep1: string;
    iosStep2: string;
    gotIt: string;
  };
  toasts: {
    noCardsDue: string;
    addedWord: (word: string) => string;
    removedWord: string;
    exportedBackup: string;
    restoredBackup: string;
    importFailed: string;
    progressReset: string;
    noZhVoice: string;
    noLocalVoice: string;
    noNetworkVoice: string;
    ttsUnsupported: string;
    ttsError: string;
  };
  quiz: {
    title: string;
    exit: string;
    questionCounter: (current: number, total: number) => string;
    mistakeRoundBadge: string;
    typeMeaning: string;
    typeListening: string;
    typeHanzi: string;
    typeMatch: string;
    typeWrite: string;
    promptMeaning: string;
    promptListening: string;
    promptHanzi: string;
    promptMatch: (matched: number, total: number) => string;
    promptWrite: string;
    playNormal: string;
    playSlow: string;
    skipWriting: string;
    correctBanner: string;
    wrongBanner: string;
    continueBtn: string;
    completeTitle: string;
    completeSummary: (correct: number, total: number, pct: number) => string;
    fsrsUpdatedNote: string;
    scheduledFor: (interval: string) => string;
    retryQuiz: string;
    backHome: string;
  };
  tonesTrainer: {
    title: string;
    subtitle: string;
    close: string;
    guideTab: string;
    drillTab: string;
    syllableGroup: string;
    tapToListen: string;
    drillPrompt: string;
    playNormal: string;
    playSlow: string;
    streakLabel: (n: number) => string;
    accuracyLabel: (correct: number, total: number) => string;
    correctTone: string;
    wrongTone: (tone: number) => string;
    nextQuestion: string;
    toneNames: Record<1 | 2 | 3 | 4 | 5, string>;
    toneDescs: Record<1 | 2 | 3 | 4 | 5, string>;
  };
  errorBoundary: {
    title: string;
    recover: string;
  };
  cardLab: {
    title: string;
    close: string;
    variant1Short: string;
    variant2Short: string;
    variant3Short: string;
    variant1Hint: string;
    variant2Hint: string;
    variant3Hint: string;
    frontSide: string;
    backSide: string;
    flipCard: string;
    showFront: string;
    showBack: string;
    prevWord: string;
    nextWord: string;
    speakZh: string;
    speakSlow: string;
    speakEn: string;
    speakExample: string;
    viewTab: string;
    strokesTab: string;
    russianMeaning: string;
    englishMeaning: string;
    exampleLabel: string;
    radicalLabel: string;
    pinyinLabel: string;
    toneColorsLabel: string;
    tapToFlip: string;
    replaySymbol: string;
    drawPrompt: string;
    fsrsPrompt: string;
    fsrsSkip: string;
    compositionTitle: string;
    mnemonicTitle: string;
    neighborsTitle: string;
    faceTitles: [string, string, string];
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDict> = {
  ru: {
    nav: {
      today: 'Сегодня',
      topics: 'Темы',
      vocabulary: 'Словарь',
      writing: 'Письмо',
      settings: 'Настройки',
    },
    common: {
      offlineBanner: 'Офлайн-режим · Используются кэшированные словари и черты',
      close: 'Закрыть',
      cancel: 'Отмена',
      hskLevel: (level) => `HSK ${level}`,
      customWord: 'Своё слово',
      radical: 'Ключ',
      daysUnit: 'дн.',
      wordsPerDay: 'слов / день',
      toggleTheme: 'Переключить светлую или тёмную тему',
    },
    dashboard: {
      newToday: 'Новых сегодня',
      dailyFocus: (levelsText, count) => `Цель дня · ${levelsText} · ${count} слов загружено`,
      goalCompleteTitle: 'Дневная цель по китайскому выполнена',
      cardsReadyTitle: (count) => `На сегодня готово карточек: ${count}`,
      goalCompleteDesc:
        'Все запланированные повторения FSRS и дневная норма новых слов пройдены. Можно взять ещё 5 слов или открыть словарь.',
      cardsReadyDesc: (newCount, dueCount) =>
        `В очереди на тренировку: ${newCount} новых слов и ${dueCount} повторений по алгоритму FSRS.`,
      startSession: 'Начать тренировку',
      studyExtra: 'Учить ещё 5 новых слов',
      quickQuiz: 'Быстрый тест',
      tonesTrainer: 'Тренажёр тонов',
      radicalsLesson: 'Базовые кирпичики',
      cardLab: '3D-Лаборатория',
      browseVocab: 'Открыть словарь',
      cardsDue: 'К повторению',
      reviewedToday: (count) => `${count} повторено сегодня`,
      studyStreak: 'Серия дней',
      lastStudy: (date) => `Посл. занятие: ${date}`,
      startStreakHint: 'Начните серию сегодня',
      masteredWords: 'Освоено слов',
      masteredRule: 'Интервал ≥ 7 дней',
      inProgress: 'В изучении',
      totalTracked: 'Отслеживается FSRS',
      curriculumTitle: 'Уровни HSK (можно выбрать несколько)',
      noLevelsSelected: 'Уровни не выбраны — нажмите на один или несколько уровней HSK',
      loadingLevel: (levelsText) => `Загрузка ${levelsText}...`,
      cachedLevel: (levelsText) => `${levelsText} сохранены локально для офлайна`,
      syncedLevel: (levelsText) => `${levelsText} загружены и кэшированы офлайн`,
      starterPackNote: (count) => `Используется встроенный стартовый набор (${count} слов)`,
      syncButton: 'Обновить выбранные',
      backupTitle: 'Резервная копия',
      backupDesc:
        'Сохраните историю повторений FSRS, серию дней и свои слова в JSON-файл перед сменой устройства.',
      exportJson: 'Экспорт JSON',
      importJson: 'Импорт JSON',
    },
    session: {
      exit: 'Выход',
      cardCounter: (current, total) => `Слово ${current} / ${total}`,
      newWordBadge: 'Новое',
      reviewBadge: 'Повтор FSRS',
      tones: 'Тоны',
      pinyinToggle: 'Пиньинь',
      pinyinHidden: 'Пиньинь скрыт',
      flashcardTab: 'Карточка',
      strokesTab: 'Черты',
      playNormal: 'Озвучить (1.0x)',
      playSlow: 'Медленно (0.7x)',
      listenEnglish: 'English',
      revealAnswer: 'Показать перевод и пиньинь',
      listenExample: 'Озвучить пример',
      prevWord: 'Назад',
      nextWord: 'Вперёд',
      finishPack: 'Вперёд к тесту',
      reviewAgain: 'Листать слова снова',
      startPackQuiz: 'Пройти тест по этим словам',
      fsrsHint: 'Когда напомнить это слово снова (FSRS):',
      fsrsQuestion: 'Как запомнилось слово? Выберите интервал повторения (FSRS):',
      backToCard: 'Назад',
      skipRating: 'Пропустить оценку и идти дальше',
      reRateWord: 'Изменить оценку FSRS',
      ratedBadge: 'Запланировано',
      completeTitle: 'Набор изучен!',
      completeSummary: (count) =>
        `Вы просмотрели ${count} слов. Теперь закрепите их коротким тестом.`,
      returnDashboard: 'На главный экран',
      grades: {
        Again: 'Снова',
        Hard: 'Трудно',
        Good: 'Хорошо',
        Easy: 'Легко',
      },
      gradeDescs: {
        Again: 'Не помню',
        Hard: 'С трудом',
        Good: 'Помню',
        Easy: 'Отлично',
      },
      toneLabels: {
        1: '1-й ровный',
        2: '2-й восх.',
        3: '3-й нисх.-восх.',
        4: '4-й падающий',
        5: 'Нейтр.',
      },
    },
    canvas: {
      practiceDrawing: 'Рисование',
      watchAnimation: 'Анимация',
      outlineOn: 'Контур вкл.',
      outlineOff: 'Контур выкл.',
      hint: 'Подсказка',
      replay: 'Повторить',
      reset: 'Сброс',
      pronounce: 'Произнести иероглиф',
      loadingStrokes: 'Загрузка черт...',
      loadError: (char) =>
        `Не удалось загрузить порядок черт для «${char}». Подключитесь к сети один раз для кэширования.`,
      noChars: (word) => `В «${word}» не найдены китайские иероглифы.`,
      completed: (mistakes) => `Готово! (ошибок: ${mistakes})`,
      strokeProgress: (done, total, mistakes) =>
        `Черта ${done} / ${total} · Ошибки: ${mistakes}`,
      watchHint: 'Следите за порядком и направлением черт',
      drawHint: 'Рисуйте по порядку черт мышкой или пальцем внутри рамки',
    },
    vocabulary: {
      title: 'Словарь и мини-справочник',
      subtitle: (levelsText, total, customCount) =>
        `${levelsText} · Всего ${total} слов (своих: ${customCount})`,
      addWord: 'Добавить слово',
      searchPlaceholder: 'Поиск: иероглиф, пиньинь (напр. beijing) или перевод...',
      filterAll: (n) => `Все (${n})`,
      filterNew: (n) => `Новые (${n})`,
      filterLearning: (n) => `В процессе (${n})`,
      filterMastered: (n) => `Освоено (${n})`,
      emptyTitle: 'Подходящие слова не найдены',
      emptyDesc: 'Попробуйте ввести пиньинь без цифр тонов или смените фильтр статуса.',
      statusNew: 'Новое',
      statusLearning: 'Изучается',
      statusMastered: 'Освоено',
      showMore: (remaining) => `Показать ещё (осталось ${remaining})`,
      meanings: 'Значения',
      reps: 'Повторов',
      stability: 'Стабильность',
      lapses: 'Ошибок',
      slowAudio: 'Медленно 0.7x',
      practiceStrokes: 'Писать черты',
      addModalTitle: 'Добавить своё слово',
      fieldHanzi: 'Иероглифы (упрощённые) *',
      fieldHanziPlaceholder: 'напр. 咖啡',
      fieldPinyin: 'Пиньинь (с тонами или цифрами) *',
      fieldPinyinPlaceholder: 'напр. kā fēi или ka1 fei1',
      fieldMeaning: 'Перевод / значение *',
      fieldMeaningPlaceholder: 'напр. кофе',
      fieldExample: 'Пример предложения (необязательно)',
      fieldExamplePlaceholder: 'напр. 我喜欢喝热咖啡。',
      validationRequired: 'Заполните иероглифы, пиньинь и перевод.',
      saveWord: 'Сохранить слово',
    },
    topics: {
      title: 'Тематики и карточки-наборы',
      subtitle: (levelsText, totalWords, packSize) =>
        `${levelsText} · ${totalWords} слов · Наборы по ${packSize} слов в день`,
      packSizeLabel: 'Слов в карточке (в день)',
      packSizeOption: (n) => `${n}`,
      backToTopics: 'Все темы',
      wordsAndPacks: (wordCount, packCount, packSize) =>
        `${wordCount} слов · ${packCount} наборов по ${packSize}`,
      learnedProgress: (learned, total) => `Изучено: ${learned} / ${total}`,
      packTitle: (num) => `Карточка #${num}`,
      packRange: (start, end, count) => `Слова ${start}–${end} · ${count} шт.`,
      studyPack: 'Учить',
      testPack: 'Тест',
      previewWords: 'Показать слова',
      hideWords: 'Скрыть слова',
      tonesBannerTitle: 'Пиньинь и 4 тона · Базовый тренажёр',
      tonesBannerDesc:
        'Разбирайте контуры 4 тонов и тренируйте слух на парах слогов (mā / má / mǎ / mà), как в HelloChinese.',
      openTonesTrainer: 'Тренировать тоны',
      radicalsBannerTitle: 'Базовые кирпичики · Топ-30 ключей',
      radicalsBannerDesc:
        'Главные мини-элементы, из которых строятся сложные иероглифы (人, 口, 心, 水, 木, 艹...). Выберите число карточек и учите как обычный урок.',
      radicalsCountLabel: 'Сколько карточек учить',
      radicalsAllOption: (total) => `Все ${total}`,
      radicalsStudyBtn: (count) => `Учить (${count})`,
      radicalsTestBtn: 'Тест',
      radicalsShowList: 'Список ключей',
      radicalsHideList: 'Скрыть список',
      emptyTitle: 'Выберите хотя бы один уровень HSK',
      emptyDesc: 'Откройте вкладку «Сегодня» и выберите уровни HSK 1–6, чтобы сформировать тематики и карточки.',
      names: {
        basics: {
          title: 'Основы, местоимения и частицы',
          desc: 'Базовые слова, вопросы, связки и счётные слова',
        },
        people: {
          title: 'Люди, семья и общество',
          desc: 'Родственники, друзья, профессии и общение с людьми',
        },
        time: {
          title: 'Время, числа и календарь',
          desc: 'Числа, дни недели, месяцы, сезоны и время суток',
        },
        food: {
          title: 'Еда, напитки и кухня',
          desc: 'Продукты, блюда, напитки, вкусы и ресторан',
        },
        home: {
          title: 'Дом, одежда и покупки',
          desc: 'Вещи дома, гардероб, цены и магазин',
        },
        places: {
          title: 'Город, места и природа',
          desc: 'Страны, погода, животные, направления и природа',
        },
        travel: {
          title: 'Транспорт и путешествия',
          desc: 'Дорога, аэропорт, поезда, отель и поездки',
        },
        work: {
          title: 'Учёба, работа и технологии',
          desc: 'Школа, офис, бизнес, наука и компьютеры',
        },
        health: {
          title: 'Здоровье, тело и спорт',
          desc: 'Самочувствие, врач, части тела и физическая активность',
        },
        communication: {
          title: 'Общение, язык и культура',
          desc: 'Речь, этикет, музыка, кино, книги и традиции',
        },
        descriptions: {
          title: 'Качества, цвета и эмоции',
          desc: 'Прилагательные, характеристики, цвета и чувства',
        },
        actions: {
          title: 'Действия и повседневные глаголы',
          desc: 'Основные действия, процессы и жизненные ситуации',
        },
        custom: {
          title: 'Мои добавленные слова',
          desc: 'Словарь, добавленный вами вручную',
        },
      },
    },
    writing: {
      title: 'Студия каллиграфии',
      subtitleFallback:
        'Рисуйте черты мышкой или пальцем — данные автоматически кэшируются офлайн',
      listen: 'Озвучить',
      inputLabel: 'Потренировать любой иероглиф или слово',
      inputPlaceholder: 'Введите иероглифы, напр. 学习',
      loadButton: 'Открыть',
      quickPicks: (levelsText) => `Быстрый выбор из ${levelsText}`,
    },
    settings: {
      title: 'Настройки обучения',
      subtitle:
        'Настройте дневную норму слов, язык интерфейса, подсветку тонов и озвучку.',
      languageTitle: 'Язык интерфейса',
      languageDesc: 'Переключение языка приложения (словари интерфейса)',
      dailyGoal: 'Слов в день и размер карточки в теме',
      dailyGoalDesc: 'Определяет дневную норму и разбивку тем на наборы по 3, 5, 7, 10, 15 или 20 слов',
      lightGoal: '3 (Лёгкий)',
      recommendedGoal: '10 (Рекомендуемый)',
      intensiveGoal: '20 (Интенсив)',
      themeTitle: 'Тема оформления',
      themeDesc: 'Светлое матовое стекло или тёмный обсидиан',
      darkMode: 'Тёмная тема',
      lightMode: 'Светлая тема',
      toneColorsTitle: 'Цвета тонов на иероглифах',
      toneColorsDesc:
        'Подсвечивать тоны: 1-й красный, 2-й зелёный, 3-й синий, 4-й фиолетовый',
      enabled: 'Включено',
      disabled: 'Выключено',
      autoPlayTitle: 'Автоозвучка в тестах',
      autoPlayDesc:
        'Озвучивать слово в заданиях теста (карточки изучения всегда озвучиваются вручную)',
      on: 'Вкл.',
      off: 'Выкл.',
      speechRateTitle: 'Скорость речи и тест голосов',
      speechRateDesc: 'Скорость 0.7x помогает лучше различать тоны',
      slowSpeed: '0.7x Медл.',
      normalSpeed: '1.0x Обычн.',
      testVoice: 'Тест (中文)',
      testEnglishVoice: 'Тест (EN)',
      testPhrase: '你好，欢迎学习中文',
      testEnglishPhrase: 'Hello, welcome to study Mandarin and English.',
      voiceSectionTitle: 'Голос и произношение',
      voiceSectionDesc: (total, localCount, networkCount, enCount) =>
        `Китайских голосов: ${total} (Лок.: ${localCount} · Сет.: ${networkCount}) · Английских: ${enCount}`,
      voiceModeTitle: 'Подключение голоса',
      voiceModeDesc: 'Локальный работает офлайн, сетевой — через интернет (облачный TTS)',
      voiceModeAuto: 'Авто',
      voiceModeLocal: 'Локальный (офлайн)',
      voiceModeNetwork: 'Сетевой (онлайн)',
      voiceGenderTitle: 'Выбор голоса (пол)',
      voiceGenderDesc: 'Подбирать женский, мужской или любой доступный голос',
      voiceGenderAny: 'Любой',
      voiceGenderFemale: 'Женский',
      voiceGenderMale: 'Мужской',
      voiceGenderUnknown: 'Стандартный',
      voiceListTitle: 'Конкретный голос системы / браузера',
      voiceAutoOption: 'Автоматический подбор по фильтрам',
      voiceAutoDesc: 'Выбирает лучший доступный голос zh-CN с учётом режима и пола',
      voiceNoMatches: 'По выбранным фильтрам (подключение / пол) голоса не найдены.',
      voiceNoMaleBrowserHint:
        'Браузер показывает только голоса, установленные в вашей ОС или браузере. В Windows и Chrome по умолчанию обычно есть только 1 женский китайский голос. Чтобы появились мужские и дополнительные женские голоса (Yunxi, Yunjian, Xiaoxiao и др.), откройте приложение в Microsoft Edge или установите дополнительные голосовые пакеты «Китайский (упрощённое письмо)» в настройках речи ОС.',
      voiceNoSystemVoices:
        'В браузере пока не обнаружены китайские голоса (zh-CN). Проверьте интернет для сетевого голоса или установите пакет Chinese (Mandarin) в настройках ОС.',
      voiceResetFilters: 'Сбросить фильтры (Авто / Любой)',
      voicePreview: 'Прослушать',
      voiceLocalTag: 'Локальный (офлайн)',
      voiceNetworkTag: 'Сетевой (онлайн)',
      offlineCacheTitle: 'Офлайн-кэш и резервные копии',
      offlineCacheSummary: (levelsText, charsCount) =>
        `Кэш уровней: ${levelsText} · Иероглифов в кэше: ${charsCount}`,
      starterPackOnly: 'Встроенный стартовый набор',
      exportBackup: 'Экспорт копии (.json)',
      restoreBackup: 'Восстановить из файла',
      resetProgress: 'Сбросить прогресс',
      confirmReset: 'Подтвердить сброс',
    },
    pwa: {
      install: 'Установить',
      installApp: 'Установить приложение',
      installIos: 'Установить на iOS',
      iosModalTitle: 'Установка Shi Ge Ci — 十个词',
      iosStep1: '1. Нажмите кнопку «Поделиться» в нижней панели Safari.',
      iosStep2: '2. Прокрутите вниз и выберите «На экран «Домой»».',
      gotIt: 'Понятно',
    },
    toasts: {
      noCardsDue:
        'Сейчас нет карточек к повторению. Переключите уровень HSK или добавьте свои слова.',
      addedWord: (word) => `Слово «${word}» добавлено в словарь.`,
      removedWord: 'Слово удалено.',
      exportedBackup: 'Резервная копия JSON успешно сохранена.',
      restoredBackup: 'Прогресс успешно восстановлен из копии.',
      importFailed: 'Не удалось прочитать файл резервной копии.',
      progressReset: 'Весь прогресс обучения сброшен.',
      noZhVoice:
        'Китайский TTS-голос (zh-CN) не найден на устройстве. Установите голосовой пакет Chinese (Mandarin) в настройках синтеза речи системы.',
      noLocalVoice:
        'Локальный (офлайн) китайский голос не найден на устройстве. Переключите режим на «Авто» / «Сетевой» или скачайте пакет Chinese (Mandarin) в ОС.',
      noNetworkVoice:
        'Сетевой (облачный) китайский голос недоступен в этом браузере. Выберите «Авто» или «Локальный».',
      ttsUnsupported: 'Синтез речи не поддерживается в этом браузере.',
      ttsError: 'Не удалось воспроизвести китайское произношение.',
    },
    quiz: {
      title: 'Интерактивный тест',
      exit: 'Выход',
      questionCounter: (current, total) => `Задание ${current} / ${total}`,
      mistakeRoundBadge: 'Работа над ошибками',
      typeMeaning: 'Перевод',
      typeListening: 'Аудирование',
      typeHanzi: 'Подбор иероглифа',
      typeMatch: 'Найди пары',
      typeWrite: 'Письмо по чертам',
      promptMeaning: 'Выберите правильный перевод этого слова:',
      promptListening: 'Послушайте слово и выберите правильный иероглиф:',
      promptHanzi: 'Какой иероглиф соответствует этому значению?',
      promptMatch: (matched, total) => `Соедините китайские слова с переводом (${matched} / ${total}):`,
      promptWrite: 'Напишите иероглиф по порядку черт:',
      playNormal: 'Озвучить (1.0x)',
      playSlow: 'Медленно (0.7x)',
      skipWriting: 'Пропустить письмо',
      correctBanner: 'Верно!',
      wrongBanner: 'Неверно — правильный ответ:',
      continueBtn: 'Далее',
      completeTitle: 'Тест пройден!',
      completeSummary: (correct, total, pct) =>
        `С первого раза верно: ${correct} из ${total} (${pct}%).`,
      fsrsUpdatedNote: 'Алгоритм FSRS автоматически обновил расписание повторений для всех слов:',
      scheduledFor: (interval) => `Повтор через ${interval}`,
      retryQuiz: 'Пройти тест ещё раз',
      backHome: 'Готово',
    },
    tonesTrainer: {
      title: 'Тренажёр пиньиня и 4 тонов',
      subtitle: 'Научитесь слышать и различать 4 основных тона и нейтральный тон в китайском языке.',
      close: 'Назад',
      guideTab: '4 тона и примеры',
      drillTab: 'Тест на слух',
      syllableGroup: 'Группа слогов',
      tapToListen: 'Нажмите на карточку, чтобы услышать тон',
      drillPrompt: 'Прослушайте слог и определите его тон:',
      playNormal: 'Озвучить (1.0x)',
      playSlow: 'Медленно (0.7x)',
      streakLabel: (n) => `Серия: ${n}`,
      accuracyLabel: (correct, total) => `Верно: ${correct}/${total}`,
      correctTone: 'Точно! Это правильный тон:',
      wrongTone: (tone) => `Не совсем — это ${tone}-й тон:`,
      nextQuestion: 'Следующий звук',
      toneNames: {
        1: '1-й тон (ровный высокий)',
        2: '2-й тон (восходящий)',
        3: '3-й тон (нисходяще-восходящий)',
        4: '4-й тон (резко падающий)',
        5: 'Нейтральный тон (лёгкий)',
      },
      toneDescs: {
        1: 'Держите голос ровно и высоко, как протяжное «а-а-а».',
        2: 'Интонация вопроса — голос идёт снизу вверх («а?»).',
        3: 'Голос опускается вниз и слегка поднимается в конце.',
        4: 'Короткий и резкий спад сверху вниз, как команда («да!»).',
        5: 'Короткий, безударный, произносится легко и тихо.',
      },
    },
    errorBoundary: {
      title: 'Восстановление экрана',
      recover: 'Вернуться на экран',
    },
    cardLab: {
      title: '3D-Лаборатория',
      close: 'Закрыть',
      variant1Short: '1 · 3D-Стек',
      variant2Short: '2 · Three.js 3D',
      variant3Short: '3 · 3D-Символ',
      variant1Hint: 'Свайпайте влево/вправо или нажмите на карточку, чтобы перевернуть',
      variant2Hint: 'Крутите 3D-плитку пальцем · быстрый свайп или кнопки переключают слово',
      variant3Hint: 'Свайп влево/вправо переворачивает символ · кнопки внизу листают слова',
      frontSide: 'Лицо',
      backSide: 'Оборот',
      flipCard: 'Перевернуть',
      showFront: 'На лицевую',
      showBack: 'На оборот',
      prevWord: 'Назад',
      nextWord: 'Вперёд',
      speakZh: '1.0x',
      speakSlow: '0.7x',
      speakEn: 'EN',
      speakExample: 'Пример',
      viewTab: 'Слово',
      strokesTab: 'Черты',
      russianMeaning: 'Перевод',
      englishMeaning: 'English',
      exampleLabel: 'Пример в контексте',
      radicalLabel: 'Ключ',
      pinyinLabel: 'Пиньинь',
      toneColorsLabel: 'Тоны',
      tapToFlip: 'Свайп ⇄ чтобы перевернуть',
      replaySymbol: 'Нажмите на символ для повтора',
      drawPrompt: 'Попробуйте написать пальцем',
      fsrsPrompt: 'Как запомнился символ?',
      fsrsSkip: 'Пропустить и далее',
      compositionTitle: 'Разбор состава',
      mnemonicTitle: 'Мнемоника',
      neighborsTitle: 'Слова-соседи',
      faceTitles: ['Символ и перевод', 'Состав и образ', 'Слова-соседи'],
    },
  },
  en: {
    nav: {
      today: 'Today',
      topics: 'Topics',
      vocabulary: 'Vocabulary',
      writing: 'Writing',
      settings: 'Settings',
    },
    common: {
      offlineBanner: 'Offline Mode · Using cached wordlists & stroke data',
      close: 'Close',
      cancel: 'Cancel',
      hskLevel: (level) => `HSK ${level}`,
      customWord: 'Custom Word',
      radical: 'Radical',
      daysUnit: 'days',
      wordsPerDay: 'words / day',
      toggleTheme: 'Toggle light or dark mode',
    },
    dashboard: {
      newToday: 'New Today',
      dailyFocus: (levelsText, count) => `Daily Focus · ${levelsText} · ${count} words loaded`,
      goalCompleteTitle: "Today's Mandarin goal is complete",
      cardsReadyTitle: (count) =>
        `${count} ${count === 1 ? 'card' : 'cards'} ready for today`,
      goalCompleteDesc:
        'All due FSRS reviews and today’s new vocabulary quota are finished. You can practice 5 extra words or browse the dictionary.',
      cardsReadyDesc: (newCount, dueCount) =>
        `${newCount} new ${newCount === 1 ? 'word' : 'words'} and ${dueCount} spaced repetition ${dueCount === 1 ? 'review' : 'reviews'} queued for your session.`,
      startSession: "Start Today's Session",
      studyExtra: 'Study 5 Extra New Words',
      quickQuiz: 'Quick Quiz',
      tonesTrainer: 'Tones Trainer',
      radicalsLesson: 'Radical Bricks',
      cardLab: '3D Card Lab',
      browseVocab: 'Browse Vocabulary',
      cardsDue: 'Cards Due',
      reviewedToday: (count) => `${count} reviewed today`,
      studyStreak: 'Study Streak',
      lastStudy: (date) => `Last: ${date}`,
      startStreakHint: 'Start your streak today',
      masteredWords: 'Mastered Words',
      masteredRule: 'Interval ≥ 7 days',
      inProgress: 'In Progress',
      totalTracked: 'Total FSRS tracked',
      curriculumTitle: 'HSK Curriculum Levels (Multi-select)',
      noLevelsSelected: 'No levels selected — click one or more HSK levels to load words',
      loadingLevel: (levelsText) => `Loading ${levelsText}...`,
      cachedLevel: (levelsText) => `${levelsText} cached locally for offline use`,
      syncedLevel: (levelsText) => `${levelsText} synced & cached offline`,
      starterPackNote: (count) => `Using offline starter pack (${count} words)`,
      syncButton: 'Sync Selected',
      backupTitle: 'Progress Backup',
      backupDesc:
        'Export your FSRS scheduling history, streak, and custom words to JSON before switching devices.',
      exportJson: 'Export JSON',
      importJson: 'Import JSON',
    },
    session: {
      exit: 'Exit',
      cardCounter: (current, total) => `Word ${current} / ${total}`,
      newWordBadge: 'New',
      reviewBadge: 'FSRS Review',
      tones: 'Tones',
      pinyinToggle: 'Pinyin',
      pinyinHidden: 'Pinyin hidden',
      flashcardTab: 'Flashcard',
      strokesTab: 'Practice Strokes',
      playNormal: 'Play (1.0x)',
      playSlow: 'Play Slow (0.7x)',
      listenEnglish: 'English',
      revealAnswer: 'Show Meaning & Pinyin',
      listenExample: 'Listen to example sentence',
      prevWord: 'Previous',
      nextWord: 'Next',
      finishPack: 'Forward to Quiz',
      reviewAgain: 'Browse Words Again',
      startPackQuiz: 'Take Quiz on These Words',
      fsrsHint: 'When to remind you of this word next (FSRS):',
      fsrsQuestion: 'How well did you remember this word? Pick FSRS interval:',
      backToCard: 'Back',
      skipRating: 'Skip rating & go next',
      reRateWord: 'Change FSRS rating',
      ratedBadge: 'Scheduled',
      completeTitle: 'Pack Studied!',
      completeSummary: (count) =>
        `You reviewed ${count} ${count === 1 ? 'word' : 'words'}. Now reinforce them with an interactive quiz.`,
      returnDashboard: 'Return to Dashboard',
      grades: {
        Again: 'Again',
        Hard: 'Hard',
        Good: 'Good',
        Easy: 'Easy',
      },
      gradeDescs: {
        Again: 'Forgot',
        Hard: 'With effort',
        Good: 'Remembered',
        Easy: 'Effortless',
      },
      toneLabels: {
        1: '1st Flat',
        2: '2nd Rising',
        3: '3rd Dip',
        4: '4th Falling',
        5: 'Neutral',
      },
    },
    canvas: {
      practiceDrawing: 'Practice Drawing',
      watchAnimation: 'Watch Animation',
      outlineOn: 'Outline On',
      outlineOff: 'Outline Off',
      hint: 'Hint',
      replay: 'Replay',
      reset: 'Reset',
      pronounce: 'Pronounce character',
      loadingStrokes: 'Loading stroke data...',
      loadError: (char) =>
        `Stroke order data for "${char}" could not be loaded. Connect online once to cache it.`,
      noChars: (word) => `No Simplified Chinese characters found in "${word}".`,
      completed: (mistakes) =>
        `Completed (${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'})`,
      strokeProgress: (done, total, mistakes) =>
        `Stroke ${done} / ${total} · Mistakes: ${mistakes}`,
      watchHint: 'Watch stroke direction & order',
      drawHint: 'Draw each stroke in order with mouse or finger',
    },
    vocabulary: {
      title: 'Vocabulary & Mini-Dictionary',
      subtitle: (levelsText, total, customCount) =>
        `${levelsText} · ${total} total words (${customCount} custom)`,
      addWord: 'Add Custom Word',
      searchPlaceholder: 'Search Chinese, Pinyin (e.g. beijing), or meaning...',
      filterAll: (n) => `All (${n})`,
      filterNew: (n) => `New (${n})`,
      filterLearning: (n) => `Learning (${n})`,
      filterMastered: (n) => `Mastered (${n})`,
      emptyTitle: 'No matching vocabulary words found',
      emptyDesc: 'Try searching with plain Pinyin (without tone numbers) or switch status filter.',
      statusNew: 'New',
      statusLearning: 'Learning',
      statusMastered: 'Mastered',
      showMore: (remaining) => `Show More (${remaining} remaining)`,
      meanings: 'Meanings',
      reps: 'Reps',
      stability: 'Stability',
      lapses: 'Lapses',
      slowAudio: 'Slow 0.7x',
      practiceStrokes: 'Practice Strokes',
      addModalTitle: 'Add Custom Word',
      fieldHanzi: 'Simplified Chinese *',
      fieldHanziPlaceholder: 'e.g. 咖啡',
      fieldPinyin: 'Pinyin (with tones or numbers) *',
      fieldPinyinPlaceholder: 'e.g. kā fēi or ka1 fei1',
      fieldMeaning: 'Meaning *',
      fieldMeaningPlaceholder: 'e.g. coffee',
      fieldExample: 'Example Sentence (Optional)',
      fieldExamplePlaceholder: 'e.g. 我喜欢喝热咖啡。',
      validationRequired: 'Please fill in Chinese characters, Pinyin, and meaning.',
      saveWord: 'Save Word',
    },
    topics: {
      title: 'Topics & Study Packs',
      subtitle: (levelsText, totalWords, packSize) =>
        `${levelsText} · ${totalWords} words · Split into ${packSize}-word packs`,
      packSizeLabel: 'Words per card pack (daily)',
      packSizeOption: (n) => `${n}`,
      backToTopics: 'All Topics',
      wordsAndPacks: (wordCount, packCount, packSize) =>
        `${wordCount} words · ${packCount} packs of ${packSize}`,
      learnedProgress: (learned, total) => `Studied: ${learned} / ${total}`,
      packTitle: (num) => `Pack #${num}`,
      packRange: (start, end, count) => `Words ${start}–${end} · ${count} items`,
      studyPack: 'Study',
      testPack: 'Quiz',
      previewWords: 'Show Words',
      hideWords: 'Hide Words',
      tonesBannerTitle: 'Pinyin & 4 Tones · Starter Trainer',
      tonesBannerDesc:
        'Explore tone pitch contours and train your ear on minimal pairs (mā / má / mǎ / mà), HelloChinese-style.',
      openTonesTrainer: 'Train Tones',
      radicalsBannerTitle: 'Core Building Blocks · Top 30 Radicals',
      radicalsBannerDesc:
        'Essential semantic components used inside Chinese characters (人, 口, 心, 水, 木, 艹...). Pick how many cards to study and train them with flashcards.',
      radicalsCountLabel: 'Cards to study',
      radicalsAllOption: (total) => `All ${total}`,
      radicalsStudyBtn: (count) => `Study (${count})`,
      radicalsTestBtn: 'Quiz',
      radicalsShowList: 'Show Radicals',
      radicalsHideList: 'Hide List',
      emptyTitle: 'Select at least one HSK level',
      emptyDesc: 'Open the Today tab and select HSK 1–6 levels to generate topic decks and word packs.',
      names: {
        basics: {
          title: 'Basics, Pronouns & Particles',
          desc: 'Core pronouns, questions, conjunctions, and classifiers',
        },
        people: {
          title: 'People, Family & Society',
          desc: 'Relatives, friends, roles, and social terms',
        },
        time: {
          title: 'Time, Numbers & Calendar',
          desc: 'Numbers, dates, days, seasons, and time expressions',
        },
        food: {
          title: 'Food, Drinks & Dining',
          desc: 'Meals, ingredients, beverages, tastes, and restaurants',
        },
        home: {
          title: 'Home, Clothing & Shopping',
          desc: 'Household items, clothes, prices, and stores',
        },
        places: {
          title: 'Places, City & Nature',
          desc: 'Geography, weather, animals, and directions',
        },
        travel: {
          title: 'Travel & Transport',
          desc: 'Transit, airports, trains, hotels, and trips',
        },
        work: {
          title: 'Study, Work & Tech',
          desc: 'School, career, business, science, and digital tools',
        },
        health: {
          title: 'Health, Body & Sports',
          desc: 'Body parts, medical terms, wellness, and exercise',
        },
        communication: {
          title: 'Communication & Culture',
          desc: 'Speaking, greetings, media, arts, and traditions',
        },
        descriptions: {
          title: 'Qualities, Colors & Feelings',
          desc: 'Adjectives, traits, colors, and emotions',
        },
        actions: {
          title: 'Daily Actions & Verbs',
          desc: 'Everyday verbs, activities, and common situations',
        },
        custom: {
          title: 'My Custom Words',
          desc: 'Vocabulary added manually by you',
        },
      },
    },
    writing: {
      title: 'Stroke Order Studio',
      subtitleFallback:
        'Draw strokes with your mouse or finger; data caches offline automatically',
      listen: 'Listen',
      inputLabel: 'Practice Any Character or Word',
      inputPlaceholder: 'Enter Chinese e.g. 学习',
      loadButton: 'Load',
      quickPicks: (levelsText) => `${levelsText} Quick Practice`,
    },
    settings: {
      title: 'Study Settings & Preferences',
      subtitle:
        'Customize your daily pacing, interface language, tone visuals, and audio speed.',
      languageTitle: 'Interface Language',
      languageDesc: 'Switch application interface dictionary (Russian / English)',
      dailyGoal: 'Daily Words & Topic Pack Size',
      dailyGoalDesc: 'Sets your daily goal and splits each topic into packs of 3, 5, 7, 10, 15, or 20 words',
      lightGoal: '3 (Light)',
      recommendedGoal: '10 (Recommended)',
      intensiveGoal: '20 (Intensive)',
      themeTitle: 'Appearance Theme',
      themeDesc: 'Switch between frosted daylight and obsidian dark glass',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      toneColorsTitle: 'Tone-Colored Characters',
      toneColorsDesc:
        'Color characters by Mandarin tone (1st Red, 2nd Green, 3rd Blue, 4th Purple)',
      enabled: 'Enabled',
      disabled: 'Disabled',
      autoPlayTitle: 'Auto-Play Audio in Quiz',
      autoPlayDesc:
        'Speak words automatically in quiz questions (study flashcards always play manually)',
      on: 'On',
      off: 'Off',
      speechRateTitle: 'Default TTS Speed & Voice Check',
      speechRateDesc: 'Choose 0.7x slow speed for clearer tone learning',
      slowSpeed: '0.7x Slow',
      normalSpeed: '1.0x Normal',
      testVoice: 'Test (中文)',
      testEnglishVoice: 'Test (EN)',
      testPhrase: '你好，欢迎学习中文',
      testEnglishPhrase: 'Hello, welcome to study Mandarin and English.',
      voiceSectionTitle: 'Voice & Pronunciation',
      voiceSectionDesc: (total, localCount, networkCount, enCount) =>
        `Chinese voices: ${total} (Local: ${localCount} · Net: ${networkCount}) · English: ${enCount}`,
      voiceModeTitle: 'Voice Connection Mode',
      voiceModeDesc: 'Local works offline on your device; network uses cloud browser voices',
      voiceModeAuto: 'Auto',
      voiceModeLocal: 'Local (Offline)',
      voiceModeNetwork: 'Network (Online)',
      voiceGenderTitle: 'Voice Gender Preference',
      voiceGenderDesc: 'Choose female, male, or any available Mandarin voice',
      voiceGenderAny: 'Any',
      voiceGenderFemale: 'Female',
      voiceGenderMale: 'Male',
      voiceGenderUnknown: 'Standard',
      voiceListTitle: 'Select Specific System / Browser Voice',
      voiceAutoOption: 'Automatic Selection by Filters',
      voiceAutoDesc: 'Picks the best zh-CN voice matching your connection & gender setting',
      voiceNoMatches: 'No Chinese voices match the selected connection and gender filters.',
      voiceNoMaleBrowserHint:
        'Your browser only exposes voices installed by your OS or browser. Windows and Chrome typically include only 1 female Chinese voice by default. To unlock male and additional neural voices (e.g. Yunxi, Yunjian, Xiaoxiao), open the app in Microsoft Edge or install extra Chinese (Mandarin) speech packs in your OS settings.',
      voiceNoSystemVoices:
        'No Chinese (zh-CN) voices detected yet. Check internet for cloud browser voices or install Chinese (Mandarin) in your OS TTS settings.',
      voiceResetFilters: 'Reset Filters (Auto / Any)',
      voicePreview: 'Preview voice',
      voiceLocalTag: 'Local (Offline)',
      voiceNetworkTag: 'Network (Online)',
      offlineCacheTitle: 'Offline Cache & Data Backup',
      offlineCacheSummary: (levelsText, charsCount) =>
        `Cached HSK levels: ${levelsText} · ${charsCount} characters cached for offline writing`,
      starterPackOnly: 'Built-in Starter Pack',
      exportBackup: 'Export Backup (.json)',
      restoreBackup: 'Restore from Backup',
      resetProgress: 'Reset Progress',
      confirmReset: 'Confirm Reset',
    },
    pwa: {
      install: 'Install',
      installApp: 'Install App',
      installIos: 'Install iOS',
      iosModalTitle: 'Install Shi Ge Ci — 十个词',
      iosStep1: '1. Tap the Share icon in the Safari toolbar.',
      iosStep2: '2. Scroll down and tap Add to Home Screen.',
      gotIt: 'Got it',
    },
    toasts: {
      noCardsDue:
        'No cards due right now. Try switching HSK levels or adding custom words.',
      addedWord: (word) => `Added "${word}" to your vocabulary.`,
      removedWord: 'Custom word removed.',
      exportedBackup: 'Backup JSON exported successfully.',
      restoredBackup: 'Backup restored successfully.',
      importFailed: 'Failed to import backup JSON.',
      progressReset: 'All study progress has been reset.',
      noZhVoice:
        'No Chinese (zh-CN) TTS voice detected on this device. Install Chinese (Mandarin) voice data in your system TTS settings.',
      noLocalVoice:
        'No offline local Chinese voice found on this device. Switch to Auto / Network or install Chinese (Mandarin) voice data in OS settings.',
      noNetworkVoice:
        'No online network Chinese voice is available in this browser. Switch to Auto or Local.',
      ttsUnsupported: 'Speech synthesis is not supported in this browser.',
      ttsError: 'Unable to play Mandarin audio on this device.',
    },
    quiz: {
      title: 'Interactive Quiz',
      exit: 'Exit',
      questionCounter: (current, total) => `Exercise ${current} / ${total}`,
      mistakeRoundBadge: 'Mistake Review',
      typeMeaning: 'Meaning',
      typeListening: 'Listening',
      typeHanzi: 'Choose Characters',
      typeMatch: 'Match Pairs',
      typeWrite: 'Stroke Writing',
      promptMeaning: 'Select the correct meaning for this word:',
      promptListening: 'Listen and choose the matching Chinese word:',
      promptHanzi: 'Which Chinese word matches this meaning?',
      promptMatch: (matched, total) => `Match Chinese words with their meanings (${matched} / ${total}):`,
      promptWrite: 'Write the character using correct stroke order:',
      playNormal: 'Play (1.0x)',
      playSlow: 'Slow (0.7x)',
      skipWriting: 'Skip writing',
      correctBanner: 'Correct!',
      wrongBanner: 'Incorrect — right answer:',
      continueBtn: 'Continue',
      completeTitle: 'Quiz Complete!',
      completeSummary: (correct, total, pct) =>
        `First-try accuracy: ${correct} of ${total} (${pct}%).`,
      fsrsUpdatedNote: 'FSRS automatically updated your spaced repetition schedule:',
      scheduledFor: (interval) => `Next in ${interval}`,
      retryQuiz: 'Practice Quiz Again',
      backHome: 'Done',
    },
    tonesTrainer: {
      title: 'Pinyin & 4 Tones Trainer',
      subtitle: 'Learn to hear and distinguish the 4 Mandarin tones and the neutral tone.',
      close: 'Back',
      guideTab: '4 Tones & Pairs',
      drillTab: 'Listening Drill',
      syllableGroup: 'Syllable Set',
      tapToListen: 'Tap any tone card to hear native Mandarin pitch',
      drillPrompt: 'Listen to the syllable and pick its tone:',
      playNormal: 'Play (1.0x)',
      playSlow: 'Slow (0.7x)',
      streakLabel: (n) => `Streak: ${n}`,
      accuracyLabel: (correct, total) => `Score: ${correct}/${total}`,
      correctTone: 'Spot on! That was:',
      wrongTone: (tone) => `Not quite — that was Tone ${tone}:`,
      nextQuestion: 'Next Sound',
      toneNames: {
        1: '1st Tone (High Flat)',
        2: '2nd Tone (Rising)',
        3: '3rd Tone (Dipping)',
        4: '4th Tone (Sharp Falling)',
        5: 'Neutral Tone (Light)',
      },
      toneDescs: {
        1: 'Hold your voice steady and high, like singing a flat note.',
        2: 'Rising pitch from middle to high, like asking a surprised question.',
        3: 'Drops low and curves slightly upward at the end.',
        4: 'Starts high and drops sharply, like a firm command.',
        5: 'Short, unstressed, and light.',
      },
    },
    errorBoundary: {
      title: 'View Recovery Needed',
      recover: 'Recover Screen',
    },
    cardLab: {
      title: '3D Card Lab',
      close: 'Close',
      variant1Short: '1 · 3D Stack',
      variant2Short: '2 · Three.js 3D',
      variant3Short: '3 · 3D Symbol',
      variant1Hint: 'Swipe left/right to navigate or tap card to flip',
      variant2Hint: 'Drag to spin the 3D tile · quick flick or bottom buttons change word',
      variant3Hint: 'Swipe left/right to flip symbol · bottom icons switch words',
      frontSide: 'Front',
      backSide: 'Back',
      flipCard: 'Flip',
      showFront: 'Front',
      showBack: 'Back',
      prevWord: 'Prev',
      nextWord: 'Next',
      speakZh: '1.0x',
      speakSlow: '0.7x',
      speakEn: 'EN',
      speakExample: 'Example',
      viewTab: 'Card',
      strokesTab: 'Strokes',
      russianMeaning: 'Russian',
      englishMeaning: 'English',
      exampleLabel: 'Context Example',
      radicalLabel: 'Radical',
      pinyinLabel: 'Pinyin',
      toneColorsLabel: 'Tones',
      tapToFlip: 'Swipe ⇄ to flip',
      replaySymbol: 'Tap symbol to replay',
      drawPrompt: 'Practice writing by finger',
      fsrsPrompt: 'How well did you recall it?',
      fsrsSkip: 'Skip & next',
      compositionTitle: 'Word Breakdown',
      mnemonicTitle: 'Memory Hook',
      neighborsTitle: 'Companion Words',
      faceTitles: ['Symbol & Meaning', 'Composition & Hook', 'Companion Words'],
    },
  },
};

export function getTranslations(language: LanguageCode): TranslationDict {
  return TRANSLATIONS[language] ?? TRANSLATIONS.ru;
}

export function formatHskLevelsLabel(levels: HskLevel[], language: LanguageCode): string {
  const sorted = Array.from(new Set(levels)).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return language === 'ru' ? 'HSK не выбран' : 'No HSK selected';
  }
  return `HSK ${sorted.join(' + ')}`;
}
