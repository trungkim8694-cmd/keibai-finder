import { StructuredAiAnalysis } from '@/types';
import { resolveAccuratePropertyType } from '@/lib/propertyDataNormalizer';

/**
 * Extracts and synthesizes legal risk and key auction metrics from Property data.
 * Zero-delay fallback parser directly from raw_display_data and existing fields,
 * seamlessly upgrading to Deep PDF AI data if present.
 */
export function resolvePropertyAiAnalysis(property: any): StructuredAiAnalysis {
  const provider = property?.source_provider || 'BIT';
  const isMof = provider === 'MOF';
  const isKsi = provider === 'KSI';
  const isNta = provider === 'NTA';
  const isKoubai = isNta || isKsi;
  const accurateType = resolveAccuratePropertyType(property);
  const isMansion = accurateType === 'マンション';
  const isCommercialOrBuilding = ['店舗・旅館', '事務所・ビル', '工場・倉庫', '一棟マンション・アパート'].includes(accurateType);
  const rawData = property?.raw_display_data;

  // 1. If deep AI analysis already exists in DB
  const rawAi = property?.ai_analysis;
  if (rawAi) {
    if (rawAi.complexityLevel && rawAi.metrics) {
      return rawAi as StructuredAiAnalysis;
    }
    if (rawAi.ja) {
      const ja = rawAi.ja;
      const arrears = ja.estimated_costs?.arrears || 0;
      const eviction = ja.estimated_costs?.eviction_cost || (isKoubai ? 40 : 25);
      const repair = ja.estimated_costs?.repair_estimate || 80;

      let level: 'A' | 'B' | 'C' | 'D' = 'A';
      if (arrears > 500000 || (ja.risk_analysis?.issues && ja.risk_analysis.issues.length >= 3)) {
        level = 'C';
      } else if (arrears > 0 || (ja.risk_analysis?.issues && ja.risk_analysis.issues.length >= 1)) {
        level = 'B';
      }

      return {
        complexityLevel: level,
        levelLabel: level === 'A' ? '標準・確認事項少' : level === 'B' ? '一般・一部確認要' : '慎重・要専門家確認',
        sourceType: 'DEEP_PDF_AI',
        summaryText: ja.risk_analysis?.issues?.join('、') || '公的記録の重要項目をAI抽出済みです。',
        metrics: {
          assumedRights: {
            status: ja.risk_analysis?.issues?.some((i: string) => i.includes('賃借') || i.includes('引受') || i.includes('敷金')) ? 'CAUTION' : 'CLEAR',
            value: ja.risk_analysis?.issues?.find((i: string) => i.includes('引受') || i.includes('敷金')) || '売却により消滅（引受権利記載なし）',
            sourceRef: isKoubai ? '公売財産明細書' : '物件明細書'
          },
          occupancy: {
            status: isKoubai ? 'OWNER' : 'OWNER',
            value: '所有者（債務者）占有と推測',
            evictionNote: isKoubai ? '公売手続（引渡命令なし・買受人自主交渉）' : '引渡命令申立制度の対象'
          },
          arrears: {
            amountYen: arrears,
            formatted: arrears > 0 
              ? `約${Math.round(arrears / 10000)}万円` 
              : (isMansion ? '滞納なし (¥0)' : isCommercialOrBuilding ? '対象外（一棟・事業用物件）' : '該当なし（一戸建て/土地）'),
            isApplicable: isMansion
          },
          landAndBuilding: {
            rightType: '所有権',
            buildingIssues: '通常経年劣化範囲'
          }
        },
        estimatedHiddenCosts: {
          arrearsMan: Math.round(arrears / 10000),
          evictionCostMan: Math.round(eviction / 10000),
          repairCostMan: Math.round(repair / 10000)
        },
        keyPoints: ja.risk_analysis?.issues || ['担保権等は代金納付により抹消登記されます。']
      };
    }
  }

  // 2. Zero-Cost Instant Heuristic & Metadata Parser from raw_display_data
  let rawTextDump = '';
  if (Array.isArray(rawData)) {
    rawData.forEach((sec: any) => {
      if (sec?.data && typeof sec.data === 'object') {
        rawTextDump += ' ' + Object.entries(sec.data).map(([k, v]) => `${k}:${v}`).join(' ');
      }
    });
  } else if (typeof rawData === 'object' && rawData !== null) {
    rawTextDump = JSON.stringify(rawData);
  }

  // A. Check Arrears (滞納管理費)
  let arrearsYen = 0;
  let arrearsFormatted = isMansion 
    ? '現況調査書に特記なし (¥0想定)' 
    : isCommercialOrBuilding 
      ? '対象外（一棟・事業用物件）' 
      : '該当なし（一戸建て/土地）';

  if (isMansion) {
    const matchArrears = rawTextDump.match(/(?:管理費|修繕積立金)[\s\S]{0,30}?(?:滞納|未納)[\s\S]{0,20}?([0-9０-９,，]+)円/);
    if (matchArrears && matchArrears[1]) {
      const cleanNum = parseInt(matchArrears[1].replace(/[,，]/g, ''), 10);
      if (!isNaN(cleanNum) && cleanNum > 0) {
        arrearsYen = cleanNum;
        arrearsFormatted = `約${Math.round(arrearsYen / 10000)}万円（承継義務あり）`;
      }
    } else if (rawTextDump.includes('滞納なし') || rawTextDump.includes('未納なし')) {
      arrearsYen = 0;
      arrearsFormatted = '滞納なし (¥0)';
    }
  }

  // B. Check Assumed Rights (買受人が引き受けるべき権利・敷金返還義務)
  let assumedRightsStatus: 'CLEAR' | 'CAUTION' | 'COMPLEX' | 'UNKNOWN' = 'CLEAR';
  let assumedRightsValue = '引受権利の特記なし（売却で担保権等抹消）';

  if (rawTextDump.includes('敷金の返還義務は買受人に承継') || rawTextDump.includes('敷金返還義務')) {
    assumedRightsStatus = 'CAUTION';
    assumedRightsValue = '賃貸借契約・敷金返還義務の承継あり（要確認）';
  } else if (rawTextDump.includes('買受人が引き受けるべき') || rawTextDump.includes('賃借権の対抗') || rawTextDump.includes('成立する法定地上権')) {
    assumedRightsStatus = 'CAUTION';
    assumedRightsValue = '引受または対抗要件付権利の記載あり（原本要確認）';
  }

  // C. Check Occupancy & Eviction (占有者状況・明渡し)
  let occupancyStatus: 'VACANT' | 'OWNER' | 'THIRD_PARTY' | 'UNKNOWN' = 'OWNER';
  let occupancyValue = '所有者（債務者）占有中';
  let evictionNote = isMof
    ? '国有財産売却（国が所有権移転登記を嘱託・現況有姿引渡し）'
    : isKsi
    ? '公有財産売却（自治体が所有権移転登記を嘱託・現況有姿引渡し）'
    : isKoubai
    ? '公売財産：引渡命令制度なし（買受人の自主交渉または民事訴訟要）'
    : '代金納付後に裁判所へ引渡命令の申立が可能';

  if (isMof) {
    occupancyStatus = 'VACANT';
    occupancyValue = '国（財務局）管理・現況有姿';
  } else if (isKsi) {
    occupancyStatus = 'VACANT';
    occupancyValue = '自治体（行政機関）管理・現況有姿';
  } else if (
    rawTextDump.includes('空家') || 
    rawTextDump.includes('空室') || 
    rawTextDump.includes('無人') || 
    rawTextDump.includes('使用されていない') || 
    rawTextDump.includes('利用されていない')
  ) {
    occupancyStatus = 'VACANT';
    occupancyValue = '空家・空室状態（不使用）';
    evictionNote = '占有者なし（残置物処分の要確認）';
  } else if (
    rawTextDump.includes('第三者が飲食店') || 
    rawTextDump.includes('賃貸借契約書') || 
    rawTextDump.includes('テナント') || 
    rawTextDump.includes('賃借人') ||
    (rawTextDump.includes('第三者') && !rawTextDump.includes('第三者私設管') && !rawTextDump.includes('第三者所有') && !rawTextDump.includes('第三者の私道'))
  ) {
    occupancyStatus = 'THIRD_PARTY';
    occupancyValue = '所有者および第三者（テナント等）占有';
    evictionNote = isKoubai 
      ? '第三者占有・賃貸契約あり：自主交渉または契約承継協議要' 
      : '占有権原の有無に応じた法的手続き・交渉が必要';
  }

  // D. Land & Building Rights (土地権利形態・建物)
  let rightType = '所有権';
  if (rawTextDump.includes('借地権') || rawTextDump.includes('賃借権設定')) {
    rightType = '借地権（地代・承諾料要確認）';
  } else if (isMansion) {
    rightType = '敷地権（所有権割合あり）';
  }

  // Building Issues (Psychological/Accident, Fire, Structural tilt, Roads/Reconstruction, Waste/Moveables)
  const defectIssues: string[] = [];
  if (rawTextDump.includes('自殺') || rawTextDump.includes('変死') || rawTextDump.includes('事故物件') || rawTextDump.includes('事件')) {
    defectIssues.push('心理的瑕疵（過去の自殺・事件等の告知あり）');
  }
  if (rawTextDump.includes('傾斜') || rawTextDump.includes('床の傾斜') || rawTextDump.includes('傾き')) {
    defectIssues.push('建物傾斜・床傾きあり');
  }
  if (rawTextDump.includes('再建築不可') || (rawTextDump.includes('位置指定道路ではない') && rawTextDump.includes('再建築'))) {
    defectIssues.push('接道制限（再建築時に自治体協議要）');
  }
  if (rawTextDump.includes('火災')) {
    defectIssues.push('過去に火災発生の記録あり（修繕要確認）');
  }
  if (rawTextDump.includes('エレベーター') && (rawTextDump.includes('故障') || rawTextDump.includes('使用できません'))) {
    defectIssues.push('エレベーター故障あり');
  }
  if (rawTextDump.includes('雨漏り')) {
    defectIssues.push('雨漏り・汚損あり');
  }
  if (rawTextDump.includes('クラック') || rawTextDump.includes('剥落')) {
    defectIssues.push('外壁クラック・剥落損傷あり');
  }
  if (rawTextDump.includes('動産が残置') || rawTextDump.includes('家具、家電') || rawTextDump.includes('廃棄物が大量') || rawTextDump.includes('残置物大量')) {
    defectIssues.push('動産・残置物保管あり（処分要）');
  }

  let buildingIssues = '通常経年劣化・特記事項なし';
  if (defectIssues.length > 0) {
    buildingIssues = defectIssues.slice(0, 2).join('、');
  }

  // E. Determine Complexity Level
  let complexityLevel: 'A' | 'B' | 'C' | 'D' = 'A';
  if (
    assumedRightsStatus === 'CAUTION' || 
    occupancyStatus === 'THIRD_PARTY' || 
    arrearsYen >= 1000000 || 
    defectIssues.length >= 2 ||
    rawTextDump.includes('火災')
  ) {
    complexityLevel = 'C';
  } else if (arrearsYen > 0 || rightType.includes('借地権') || isKoubai || defectIssues.length === 1) {
    complexityLevel = 'B';
  }

  const levelLabels = {
    A: '標準・確認事項少（初心者〜実需向）',
    B: '一般・要点確認推奨（標準投資向）',
    C: '慎重・要専門家確認（経験者向）',
    D: '複雑・法的整理要（プロ・業者向）'
  };

  // F. Estimated Hidden Costs (in 10,000 Yen)
  const isLandOnly = property?.property_type === '土地' || (!property?.building_area && property?.land_area);
  const arrearsMan = Math.round(arrearsYen / 10000);
  // MOF & KSI public assets have NO court eviction or debtor occupying
  const evictionCostMan = (isMof || isKsi) ? 0 : occupancyStatus === 'VACANT' ? 10 : isKoubai ? 45 : 30;
  // Land or MOF/KSI state properties don't have building renovation expenses
  let repairCostMan = (isMof || isKsi || isLandOnly) ? 0 : isMansion ? 60 : 100;
  if (!isMof && !isKsi && !isLandOnly) {
    if (defectIssues.length >= 2 || rawTextDump.includes('火災')) {
      repairCostMan = 350;
    } else if (defectIssues.length === 1) {
      repairCostMan = 200;
    }
  }

  // G. Summary Text & Key Points
  let summaryText = '';
  if (isMof) {
    summaryText = `本物件は財務省（${property.court_name || '管轄財務局'}）が公示する国有財産売却案件です。国との直接売買契約となり、所有権移転登記は国が嘱託で行う標準的な一般競争入札プロセスが見込まれます。`;
  } else if (isKsi) {
    summaryText = `本物件は${property.court_name || property.managing_authority || '出品自治体'}が公示する公有財産売却案件です。自治体との直接契約となり、所有権移転登記は行政機関が嘱託で行う安全性の高い一般競争入札プロセスが見込まれます。`;
  } else if (complexityLevel === 'A') {
    summaryText = `本物件は${occupancyValue}であり、買受人が引き受けるべき権利特記も見当たりません。標準的な${isKoubai ? '公売' : '競売'}取得プロセスが見込まれます。`;
  } else if (complexityLevel === 'B') {
    summaryText = `本物件は${isKoubai ? '公売手続（引渡命令なし）' : (arrearsYen > 0 ? `滞納管理費（約${arrearsMan}万円）の承継` : '一部確認事項')}があります。事前に収支試算と現地確認を推奨します。`;
  } else {
    summaryText = `本物件は権利関係（賃貸契約や敷金承継等）または建物現況（設備故障や修繕等）において専門的な確認が推奨される留意事項があります。原本資料の精読を推奨します。`;
  }

  const keyPoints: string[] = [];
  if (isMof) {
    keyPoints.push('財務省（管轄財務局）が売主となる国有財産の一般競争入札です。');
    keyPoints.push('裁判所の競売とは異なり、抵当権等の債務差押処理はなく、残代金納付後に国が所有権移転登記を嘱託（嘱託登記）します。');
    keyPoints.push('国との売買契約のため売買契約書の印紙税は非課税（0円）となります（登録免許税等は買受人負担）。');
    keyPoints.push('国は瑕疵担保責任（契約不適合責任）を負わない現況有姿引渡しのため、現地の境界標や越境物の確認が推奨されます。');
  } else if (isKsi) {
    keyPoints.push(`${property.court_name || property.managing_authority || '出品自治体'}が売主となる公有財産の一般競争入札です。`);
    keyPoints.push('差押えによる公売とは異なり、抵当権等の債務差押処理はなく、残代金納付後に自治体が所有権移転登記を嘱託（嘱託登記）します。');
    keyPoints.push('地方自治法に基づき、原則として瑕疵担保責任（契約不適合責任）を負わない現況有姿引渡しとなります。');
    keyPoints.push('現地の境界標や越境物、公共インフラ（上下水道等）の引込状況について案内書の事前確認が推奨されます。');
  } else if (isNta) {
    keyPoints.push('公売物件のため、裁判所の「引渡命令制度」は適用されません。明渡しは落札者の自主交渉となります。');
    if (defectIssues.some(d => d.includes('心理的瑕疵'))) {
      keyPoints.push('【告知事項】公売特記事項に居住者の自殺等の情報が記載されています（心理的瑕疵の確認を推奨）。');
    }
    if (defectIssues.some(d => d.includes('接道制限'))) {
      keyPoints.push('【接道・再建築】建築基準法上の位置指定道路ではないため、再建築時には自治体建築指導課との事前協議が必要です。');
    }
    if (defectIssues.some(d => d.includes('動産・残置物'))) {
      keyPoints.push('【残置物】建物内に家具・動産等の残置物があります。現況有姿引渡しのため買受人での処分が必要です。');
    }
    if (defectIssues.some(d => d.includes('建物傾斜'))) {
      keyPoints.push('【建物現況】床等に傾斜が認められます。内覧または修繕工事の検討を推奨します。');
    }
  } else {
    keyPoints.push('競売の代金納付により、抵当権・差押等の担保権は原則すべて裁判所嘱託で抹消されます。');
  }

  if (assumedRightsStatus === 'CAUTION') {
    keyPoints.push(assumedRightsValue);
  }

  if (defectIssues.length > 0 && !isNta) {
    keyPoints.push(`現況留意点: ${defectIssues.join('、')}`);
  }

  if (isMansion && arrearsYen > 0) {
    keyPoints.push(`滞納管理費等（約${arrearsMan}万円）は区分所有法第8条に基づき買受人が承継します。`);
  }

  return {
    complexityLevel,
    levelLabel: levelLabels[complexityLevel],
    sourceType: property?.ai_analysis ? 'DEEP_PDF_AI' : 'STRUCTURED_DATA_AI',
    summaryText,
    metrics: {
      assumedRights: {
        status: assumedRightsStatus,
        value: assumedRightsValue,
        sourceRef: isMof ? '物件調書（財務省）' : isKsi ? '公有財産売却案内書' : isNta ? '公売財産明細書' : '物件明細書'
      },
      occupancy: {
        status: occupancyStatus,
        value: occupancyValue,
        evictionNote
      },
      arrears: {
        amountYen: arrearsYen,
        formatted: arrearsFormatted,
        isApplicable: isMansion
      },
      landAndBuilding: {
        rightType,
        buildingIssues
      }
    },
    estimatedHiddenCosts: {
      arrearsMan,
      evictionCostMan,
      repairCostMan
    },
    keyPoints
  };
}
