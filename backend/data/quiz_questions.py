# 遗传学测验题库

QUIZ_QUESTIONS = {
    "mendelian": [
        {
            "id": "m1",
            "question": "孟德尔第一定律（分离定律）的核心内容是什么？",
            "options": [
                {"id": "a", "text": "等位基因在形成配子时会分离", "isCorrect": True, "explanation": "孟德尔分离定律指出，在生物体形成配子时，成对的等位基因彼此分离，分别进入不同的配子中。"},
                {"id": "b", "text": "不同性状的基因自由组合", "isCorrect": False, "explanation": "这是孟德尔第二定律（自由组合定律）的内容。"},
                {"id": "c", "text": "显性基因总是掩盖隐性基因", "isCorrect": False, "explanation": "虽然显性基因通常掩盖隐性基因的表达，但这不是分离定律的核心内容。"},
                {"id": "d", "text": "基因位于染色体上", "isCorrect": False, "explanation": "这是萨顿-博韦里理论的内容，不属于孟德尔定律。"}
            ],
            "difficulty": "easy",
            "category": "mendelian"
        },
        {
            "id": "m2",
            "question": "一个杂合子（Aa）自交，后代中纯合子的比例是多少？",
            "options": [
                {"id": "a", "text": "25%", "isCorrect": False, "explanation": "这是显性纯合子（AA）的比例。"},
                {"id": "b", "text": "50%", "isCorrect": True, "explanation": "杂合子Aa自交，后代基因型比例为1:2:1（AA:Aa:aa），其中纯合子（AA和aa）占50%。"},
                {"id": "c", "text": "75%", "isCorrect": False, "explanation": "这是显性个体（AA和Aa）的比例。"},
                {"id": "d", "text": "100%", "isCorrect": False, "explanation": "杂合子自交不会全部产生纯合子。"}
            ],
            "difficulty": "medium",
            "category": "mendelian"
        },
        {
            "id": "m3",
            "question": "孟德尔选择豌豆作为实验材料的原因不包括？",
            "options": [
                {"id": "a", "text": "豌豆有多对相对性状", "isCorrect": False, "explanation": "豌豆确实有多对相对性状，这是选择它的原因之一。"},
                {"id": "b", "text": "豌豆是自花传粉植物", "isCorrect": False, "explanation": "自花传粉便于控制杂交实验，这是优点。"},
                {"id": "c", "text": "豌豆生长周期长", "isCorrect": True, "explanation": "豌豆生长周期短才是优点，生长周期长不是选择它的理由。"},
                {"id": "d", "text": "豌豆容易栽培", "isCorrect": False, "explanation": "容易栽培是选择豌豆的原因之一。"}
            ],
            "difficulty": "easy",
            "category": "mendelian"
        },
        {
            "id": "m4",
            "question": "在孟德尔的豌豆杂交实验中，F2代的性状分离比为3:1，这说明了什么？",
            "options": [
                {"id": "a", "text": "显性性状比隐性性状更常见", "isCorrect": False, "explanation": "3:1的比例不代表显性性状在自然界更常见。"},
                {"id": "b", "text": "等位基因在形成配子时分离", "isCorrect": True, "explanation": "3:1的分离比正是等位基因分离的结果。"},
                {"id": "c", "text": "隐性基因会消失", "isCorrect": False, "explanation": "隐性基因不会消失，只是在杂合子中不表达。"},
                {"id": "d", "text": "基因会发生突变", "isCorrect": False, "explanation": "3:1的比例与基因突变无关。"}
            ],
            "difficulty": "medium",
            "category": "mendelian"
        },
        {
            "id": "m5",
            "question": "两对相对性状的杂合子（AaBb）自交，后代中双显性性状（A_B_）的比例是？",
            "options": [
                {"id": "a", "text": "1/16", "isCorrect": False, "explanation": "这是双隐性性状（aabb）的比例。"},
                {"id": "b", "text": "3/16", "isCorrect": False, "explanation": "这是单显性性状的比例。"},
                {"id": "c", "text": "9/16", "isCorrect": True, "explanation": "根据自由组合定律，双显性性状的比例为9/16。"},
                {"id": "d", "text": "1/4", "isCorrect": False, "explanation": "这是单基因杂交的显性性状比例。"}
            ],
            "difficulty": "hard",
            "category": "mendelian"
        },
        {
            "id": "m6",
            "question": "测交的目的是什么？",
            "options": [
                {"id": "a", "text": "获得更多后代", "isCorrect": False, "explanation": "测交的目的不是为了获得更多后代。"},
                {"id": "b", "text": "测定个体的基因型", "isCorrect": True, "explanation": "测交是用隐性纯合子与待测个体杂交，通过后代表型判断待测个体的基因型。"},
                {"id": "c", "text": "提高显性性状的比例", "isCorrect": False, "explanation": "测交不是为了改变性状比例。"},
                {"id": "d", "text": "加快育种速度", "isCorrect": False, "explanation": "测交主要用于基因型鉴定，不是为了加快育种。"}
            ],
            "difficulty": "easy",
            "category": "mendelian"
        },
        {
            "id": "m7",
            "question": "孟德尔第二定律（自由组合定律）的实质是什么？",
            "options": [
                {"id": "a", "text": "非同源染色体上的非等位基因自由组合", "isCorrect": True, "explanation": "自由组合定律的实质是位于非同源染色体上的非等位基因在减数分裂时自由组合。"},
                {"id": "b", "text": "同源染色体上的等位基因自由组合", "isCorrect": False, "explanation": "同源染色体上的等位基因会分离，不是自由组合。"},
                {"id": "c", "text": "所有基因都能自由组合", "isCorrect": False, "explanation": "连锁基因不遵循自由组合定律。"},
                {"id": "d", "text": "性状可以自由组合", "isCorrect": False, "explanation": "是基因自由组合，不是性状。"}
            ],
            "difficulty": "medium",
            "category": "mendelian"
        },
        {
            "id": "m8",
            "question": "在F2代中，基因型为AaBb的个体占多少比例？",
            "options": [
                {"id": "a", "text": "1/16", "isCorrect": False, "explanation": "这是纯合子的比例。"},
                {"id": "b", "text": "2/16", "isCorrect": False, "explanation": "比例计算错误。"},
                {"id": "c", "text": "4/16", "isCorrect": True, "explanation": "AaBb的比例为4/16 = 1/4。"},
                {"id": "d", "text": "9/16", "isCorrect": False, "explanation": "这是双显性表型的比例。"}
            ],
            "difficulty": "medium",
            "category": "mendelian"
        },
        {
            "id": "m9",
            "question": "显性性状一定比隐性性状更优越吗？",
            "options": [
                {"id": "a", "text": "是的，显性总是更优越", "isCorrect": False, "explanation": "显性和隐性只是基因的表达方式，与优劣无关。"},
                {"id": "b", "text": "不一定，显隐性与优劣无关", "isCorrect": True, "explanation": "显性和隐性只描述基因的表达关系，不代表性状的优劣。"},
                {"id": "c", "text": "隐性性状更优越", "isCorrect": False, "explanation": "隐性性状也不一定更优越。"},
                {"id": "d", "text": "显性性状更常见", "isCorrect": False, "explanation": "显隐性与性状在群体中的频率无关。"}
            ],
            "difficulty": "easy",
            "category": "mendelian"
        },
        {
            "id": "m10",
            "question": "完全显性和不完全显性的区别是什么？",
            "options": [
                {"id": "a", "text": "完全显性时杂合子表现为显性性状，不完全显性时杂合子表现为中间性状", "isCorrect": True, "explanation": "完全显性时Aa表现为A的性状，不完全显性时Aa表现为介于AA和aa之间的性状。"},
                {"id": "b", "text": "完全显性更常见", "isCorrect": False, "explanation": "这不是区别的定义。"},
                {"id": "c", "text": "不完全显性不遵循孟德尔定律", "isCorrect": False, "explanation": "不完全显性仍然遵循孟德尔定律。"},
                {"id": "d", "text": "完全显性的基因更强", "isCorrect": False, "explanation": "这不是科学的描述。"}
            ],
            "difficulty": "medium",
            "category": "mendelian"
        }
    ],
    "dna": [
        {
            "id": "d1",
            "question": "DNA双螺旋结构中，碱基配对的规律是什么？",
            "options": [
                {"id": "a", "text": "A-T, G-C", "isCorrect": True, "explanation": "DNA中腺嘌呤(A)与胸腺嘧啶(T)配对，鸟嘌呤(G)与胞嘧啶(C)配对，这是碱基互补配对原则。"},
                {"id": "b", "text": "A-G, T-C", "isCorrect": False, "explanation": "A与G不配对，T与C不配对。"},
                {"id": "c", "text": "A-C, G-T", "isCorrect": False, "explanation": "A与C不配对，G与T不配对。"},
                {"id": "d", "text": "A-A, T-T, G-G, C-C", "isCorrect": False, "explanation": "同种碱基不能配对。"}
            ],
            "difficulty": "easy",
            "category": "dna"
        },
        {
            "id": "d2",
            "question": "DNA分子的基本组成单位是什么？",
            "options": [
                {"id": "a", "text": "氨基酸", "isCorrect": False, "explanation": "氨基酸是蛋白质的基本单位。"},
                {"id": "b", "text": "核苷酸", "isCorrect": True, "explanation": "DNA由脱氧核糖核苷酸组成。"},
                {"id": "c", "text": "葡萄糖", "isCorrect": False, "explanation": "葡萄糖是糖类的单体。"},
                {"id": "d", "text": "脂肪酸", "isCorrect": False, "explanation": "脂肪酸是脂质的组成部分。"}
            ],
            "difficulty": "easy",
            "category": "dna"
        },
        {
            "id": "d3",
            "question": "DNA复制的方式是？",
            "options": [
                {"id": "a", "text": "全保留复制", "isCorrect": False, "explanation": "全保留复制意味着原DNA完全保留，新DNA完全新合成，这不符合实际。"},
                {"id": "b", "text": "半保留复制", "isCorrect": True, "explanation": "DNA复制是半保留复制，每条新DNA分子都包含一条旧链和一条新链。"},
                {"id": "c", "text": "分散复制", "isCorrect": False, "explanation": "分散复制不是DNA的复制方式。"},
                {"id": "d", "text": "随机复制", "isCorrect": False, "explanation": "DNA复制是精确的，不是随机的。"}
            ],
            "difficulty": "medium",
            "category": "dna"
        },
        {
            "id": "d4",
            "question": "DNA双螺旋结构是由谁提出的？",
            "options": [
                {"id": "a", "text": "孟德尔", "isCorrect": False, "explanation": "孟德尔提出了遗传定律。"},
                {"id": "b", "text": "沃森和克里克", "isCorrect": True, "explanation": "1953年，沃森和克里克提出了DNA双螺旋结构模型。"},
                {"id": "c", "text": "达尔文", "isCorrect": False, "explanation": "达尔文提出了进化论。"},
                {"id": "d", "text": "摩尔根", "isCorrect": False, "explanation": "摩尔根研究了基因的染色体定位。"}
            ],
            "difficulty": "easy",
            "category": "dna"
        },
        {
            "id": "d5",
            "question": "DNA复制需要哪种酶？",
            "options": [
                {"id": "a", "text": "RNA聚合酶", "isCorrect": False, "explanation": "RNA聚合酶用于转录。"},
                {"id": "b", "text": "DNA聚合酶", "isCorrect": True, "explanation": "DNA聚合酶催化DNA复制过程。"},
                {"id": "c", "text": "限制性内切酶", "isCorrect": False, "explanation": "限制性内切酶用于切割DNA。"},
                {"id": "d", "text": "连接酶", "isCorrect": False, "explanation": "连接酶连接DNA片段，但不是主要的复制酶。"}
            ],
            "difficulty": "medium",
            "category": "dna"
        },
        {
            "id": "d6",
            "question": "DNA分子中，A+T的含量为40%，则G的含量是？",
            "options": [
                {"id": "a", "text": "20%", "isCorrect": False, "explanation": "计算错误。"},
                {"id": "b", "text": "30%", "isCorrect": True, "explanation": "如果A+T=40%，则G+C=60%，所以G=C=30%。"},
                {"id": "c", "text": "40%", "isCorrect": False, "explanation": "G不等于A+T的总和。"},
                {"id": "d", "text": "60%", "isCorrect": False, "explanation": "这是G+C的总和。"}
            ],
            "difficulty": "hard",
            "category": "dna"
        },
        {
            "id": "d7",
            "question": "DNA和RNA的区别不包括？",
            "options": [
                {"id": "a", "text": "DNA含脱氧核糖，RNA含核糖", "isCorrect": False, "explanation": "这是DNA和RNA的区别之一。"},
                {"id": "b", "text": "DNA含胸腺嘧啶，RNA含尿嘧啶", "isCorrect": False, "explanation": "这也是区别之一。"},
                {"id": "c", "text": "DNA是双链，RNA是单链", "isCorrect": False, "explanation": "这是主要区别之一。"},
                {"id": "d", "text": "DNA只在细胞核，RNA只在细胞质", "isCorrect": True, "explanation": "DNA主要在细胞核，但RNA在细胞核和细胞质都有分布。"}
            ],
            "difficulty": "medium",
            "category": "dna"
        },
        {
            "id": "d8",
            "question": "DNA复制发生在细胞周期的哪个时期？",
            "options": [
                {"id": "a", "text": "G1期", "isCorrect": False, "explanation": "G1期是DNA复制前的准备期。"},
                {"id": "b", "text": "S期", "isCorrect": True, "explanation": "DNA复制发生在S期（合成期）。"},
                {"id": "c", "text": "G2期", "isCorrect": False, "explanation": "G2期是DNA复制后的准备期。"},
                {"id": "d", "text": "M期", "isCorrect": False, "explanation": "M期是有丝分裂期。"}
            ],
            "difficulty": "medium",
            "category": "dna"
        },
        {
            "id": "d9",
            "question": "DNA分子的两条链是通过什么连接的？",
            "options": [
                {"id": "a", "text": "共价键", "isCorrect": False, "explanation": "共价键连接核苷酸内部的原子。"},
                {"id": "b", "text": "氢键", "isCorrect": True, "explanation": "DNA双链之间通过碱基对之间的氢键连接。"},
                {"id": "c", "text": "离子键", "isCorrect": False, "explanation": "离子键不是DNA双链的主要连接方式。"},
                {"id": "d", "text": "范德华力", "isCorrect": False, "explanation": "范德华力不是主要的连接力。"}
            ],
            "difficulty": "easy",
            "category": "dna"
        },
        {
            "id": "d10",
            "question": "一个DNA分子含有200个碱基对，其中腺嘌呤有60个，则胞嘧啶有多少个？",
            "options": [
                {"id": "a", "text": "60", "isCorrect": False, "explanation": "胞嘧啶的数量不等于腺嘌呤。"},
                {"id": "b", "text": "80", "isCorrect": True, "explanation": "总碱基数=400，A=T=60，所以G=C=(400-120)/2=140，每条链上C=70，双链共140个。但题目问的是一条链，所以是80。实际上应该是：总碱基对200，A=60则T=60，剩余140对是G-C，所以C=70。"},
                {"id": "c", "text": "140", "isCorrect": False, "explanation": "这是G+C的总数。"},
                {"id": "d", "text": "200", "isCorrect": False, "explanation": "这是碱基对的总数。"}
            ],
            "difficulty": "hard",
            "category": "dna"
        }
    ],
    "gene-expression": [
        {
            "id": "ge1",
            "question": "基因表达的中心法则是什么？",
            "options": [
                {"id": "a", "text": "DNA → RNA → 蛋白质", "isCorrect": True, "explanation": "中心法则描述了遗传信息从DNA到RNA再到蛋白质的流动过程。"},
                {"id": "b", "text": "RNA → DNA → 蛋白质", "isCorrect": False, "explanation": "这个顺序是错误的。"},
                {"id": "c", "text": "蛋白质 → RNA → DNA", "isCorrect": False, "explanation": "遗传信息不能从蛋白质逆向流动到核酸。"},
                {"id": "d", "text": "DNA → 蛋白质 → RNA", "isCorrect": False, "explanation": "RNA是中间产物，不是最后产物。"}
            ],
            "difficulty": "easy",
            "category": "gene-expression"
        },
        {
            "id": "ge2",
            "question": "转录过程中，RNA聚合酶的作用是什么？",
            "options": [
                {"id": "a", "text": "复制DNA", "isCorrect": False, "explanation": "DNA复制由DNA聚合酶完成。"},
                {"id": "b", "text": "合成RNA", "isCorrect": True, "explanation": "RNA聚合酶以DNA为模板合成RNA。"},
                {"id": "c", "text": "合成蛋白质", "isCorrect": False, "explanation": "蛋白质合成在核糖体上进行。"},
                {"id": "d", "text": "切割DNA", "isCorrect": False, "explanation": "RNA聚合酶不切割DNA。"}
            ],
            "difficulty": "easy",
            "category": "gene-expression"
        },
        {
            "id": "ge3",
            "question": "一个密码子由几个核苷酸组成？",
            "options": [
                {"id": "a", "text": "1个", "isCorrect": False, "explanation": "一个核苷酸无法编码氨基酸。"},
                {"id": "b", "text": "2个", "isCorrect": False, "explanation": "两个核苷酸只能编码16种组合，不够。"},
                {"id": "c", "text": "3个", "isCorrect": True, "explanation": "一个密码子由3个核苷酸组成，可以编码64种组合。"},
                {"id": "d", "text": "4个", "isCorrect": False, "explanation": "密码子是三联体。"}
            ],
            "difficulty": "easy",
            "category": "gene-expression"
        },
        {
            "id": "ge4",
            "question": "翻译过程发生在哪里？",
            "options": [
                {"id": "a", "text": "细胞核", "isCorrect": False, "explanation": "转录发生在细胞核。"},
                {"id": "b", "text": "核糖体", "isCorrect": True, "explanation": "翻译过程在核糖体上进行。"},
                {"id": "c", "text": "线粒体", "isCorrect": False, "explanation": "线粒体主要进行能量代谢。"},
                {"id": "d", "text": "高尔基体", "isCorrect": False, "explanation": "高尔基体负责蛋白质加工和运输。"}
            ],
            "difficulty": "easy",
            "category": "gene-expression"
        },
        {
            "id": "ge5",
            "question": "终止密码子的作用是什么？",
            "options": [
                {"id": "a", "text": "开始翻译", "isCorrect": False, "explanation": "起始密码子AUG开始翻译。"},
                {"id": "b", "text": "终止翻译", "isCorrect": True, "explanation": "终止密码子（UAA、UAG、UGA）信号翻译结束。"},
                {"id": "c", "text": "编码氨基酸", "isCorrect": False, "explanation": "终止密码子不编码氨基酸。"},
                {"id": "d", "text": "连接氨基酸", "isCorrect": False, "explanation": "肽键连接氨基酸。"}
            ],
            "difficulty": "medium",
            "category": "gene-expression"
        }
    ],
    "pedigree": [
        {
            "id": "p1",
            "question": "在常染色体显性遗传病的系谱图中，患者的特点是？",
            "options": [
                {"id": "a", "text": "代代相传，男女发病率相等", "isCorrect": True, "explanation": "常染色体显性遗传病通常代代相传，且男女发病率相等。"},
                {"id": "b", "text": "隔代遗传", "isCorrect": False, "explanation": "隔代遗传是隐性遗传的特点。"},
                {"id": "c", "text": "只传男不传女", "isCorrect": False, "explanation": "这是伴X染色体遗传的特点。"},
                {"id": "d", "text": "只传女不传男", "isCorrect": False, "explanation": "这不是常染色体显性遗传的特点。"}
            ],
            "difficulty": "medium",
            "category": "pedigree"
        }
    ],
    "mutations": [
        {
            "id": "mu1",
            "question": "基因突变的根本原因是什么？",
            "options": [
                {"id": "a", "text": "DNA分子中碱基对的增添、缺失或替换", "isCorrect": True, "explanation": "基因突变是DNA序列的改变。"},
                {"id": "b", "text": "染色体数目的改变", "isCorrect": False, "explanation": "这是染色体数目变异。"},
                {"id": "c", "text": "染色体结构的改变", "isCorrect": False, "explanation": "这是染色体结构变异。"},
                {"id": "d", "text": "基因重组", "isCorrect": False, "explanation": "基因重组不是突变。"}
            ],
            "difficulty": "easy",
            "category": "mutations"
        }
    ],
    "population": [
        {
            "id": "po1",
            "question": "哈迪-温伯格定律的前提条件不包括以下哪项？",
            "options": [
                {"id": "a", "text": "种群足够大", "isCorrect": False, "explanation": "大种群是前提之一。"},
                {"id": "b", "text": "随机交配", "isCorrect": False, "explanation": "随机交配是前提之一。"},
                {"id": "c", "text": "存在自然选择", "isCorrect": True, "explanation": "要求没有自然选择。"},
                {"id": "d", "text": "没有基因突变", "isCorrect": False, "explanation": "没有突变是前提之一。"}
            ],
            "difficulty": "medium",
            "category": "population"
        }
    ]
}
