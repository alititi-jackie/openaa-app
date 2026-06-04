// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketType = 'parking' | 'red-light' | 'speed-camera' | 'traffic' | 'toll' | 'unknown'

export interface Entry {
  label: string
  url: string
  description: string
  types: TicketType[]
  isOfficial?: boolean
}

export interface StateData {
  state: string
  stateNameZh: string
  stateNameEn: string
  entries: Entry[]
  fallbackUrl?: string
}

// ---------------------------------------------------------------------------
// State data
// ---------------------------------------------------------------------------

export const stateDataMap: Record<string, StateData> = {
  NY: {
    state: 'NY',
    stateNameZh: '纽约州',
    stateNameEn: 'New York',
    entries: [
      {
        label: 'NYC Finance CityPay — 停车/红灯/超速拍照罚单',
        url: 'https://a836-citypay.nyc.gov/citypay/ParkingCamera',
        description: '适合纽约市停车罚单、红灯拍照罚单（Red Light Camera）、超速拍照罚单（Speed Camera）等。可输入罚单号或车牌号查询和缴费。',
        types: ['parking', 'red-light', 'speed-camera'],
        isOfficial: true,
      },
      {
        label: 'NY DMV TVB — 交通罚单 / Moving Violation',
        url: 'https://transact.dmv.ny.gov/TicketPayments/',
        description: '适合纽约州交通罚单（moving violation），包括 TVB（Traffic Violations Bureau）管辖的纽约市五区部分罚单。具体以官方系统为准。',
        types: ['traffic'],
        isOfficial: true,
      },
      {
        label: 'E-ZPass New York — 过路费 / Toll',
        url: 'https://www.e-zpassny.com/',
        description: '适合 E-ZPass 账户管理、过路费查询、桥隧通行费和违规通行费（Tolls by Mail）处理。',
        types: ['toll'],
        isOfficial: true,
      },
      {
        label: 'NY DMV 官网 — 通用入口',
        url: 'https://dmv.ny.gov/',
        description: '纽约州 DMV 官方网站，可查询驾照状态、车辆注册、罚单记录等各类信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://dmv.ny.gov/',
  },
  NJ: {
    state: 'NJ',
    stateNameZh: '新泽西州',
    stateNameEn: 'New Jersey',
    entries: [
      {
        label: 'NJ MVC — 交通罚单 / Traffic Violations',
        url: 'https://www.nj.gov/mvc/Violations/violations.htm',
        description: '新泽西州机动车管理委员会（MVC），可查询交通违规记录、驾驶分数和罚单处理信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: 'NJ 法院在线缴费 — Municipal Court Ticket',
        url: 'https://www.njcourts.gov/public/services/online-ticket-payment',
        description: '新泽西州法院在线服务，可在线处理市级法院（Municipal Court）罚单缴费。部分罚单需在当地法院处理。',
        types: ['parking', 'traffic'],
        isOfficial: true,
      },
      {
        label: 'E-ZPass New Jersey — 过路费 / Toll',
        url: 'https://www.ezpassnj.com/',
        description: '新泽西 E-ZPass 账户管理、过路费查询及处理。也可处理 NJ Turnpike 和 Garden State Parkway 相关通行费。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.nj.gov/mvc/',
  },
  CA: {
    state: 'CA',
    stateNameZh: '加利福尼亚州',
    stateNameEn: 'California',
    entries: [
      {
        label: 'LA 洛杉矶停车罚单查询',
        url: 'https://citationpaymentla.lacity.org/',
        description: '洛杉矶市停车罚单官方查询与缴费入口，可通过罚单号或车牌号查询。',
        types: ['parking'],
        isOfficial: true,
      },
      {
        label: 'SFMTA 旧金山停车罚单',
        url: 'https://www.sfmta.com/getting-around/drive-park/citations',
        description: '旧金山市交通局（SFMTA）停车罚单、红灯拍照罚单查询与缴费入口。',
        types: ['parking', 'red-light', 'speed-camera'],
        isOfficial: true,
      },
      {
        label: 'CA DMV — 交通违规记录',
        url: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/driver-license-dl-status/',
        description: '加州 DMV 可查询驾驶记录、交通违规分数等。交通罚单缴费通常需前往发单的法院或城市官方网站。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: 'CA 法院交通罚单说明',
        url: 'https://selfhelp.courts.ca.gov/traffic-tickets',
        description: '加州法院自助中心提供交通罚单处理说明，包括缴费、申诉和 traffic school 选项。',
        types: ['traffic'],
        isOfficial: true,
      },
      {
        label: 'FasTrak — 过路费 / Toll',
        url: 'https://www.bayareafastrak.org/',
        description: '加州湾区及全州高速公路过路费（FasTrak）查询和账户管理入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.dmv.ca.gov/',
  },
  TX: {
    state: 'TX',
    stateNameZh: '德克萨斯州',
    stateNameEn: 'Texas',
    entries: [
      {
        label: '德州法院交通罚单',
        url: 'https://www.txcourts.gov/programs-services/basic-civil-legal-services/traffic-tickets/',
        description: '德克萨斯州法院系统提供的交通罚单处理说明，可查询所在县或城市的法院入口。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: '休斯顿停车罚单',
        url: 'https://parking.houstontx.gov/',
        description: '休斯顿市停车罚单官方查询与缴费入口，可通过罚单号或车牌号查询。',
        types: ['parking'],
        isOfficial: true,
      },
      {
        label: 'TxTag — 德州过路费 / Toll',
        url: 'https://www.txtag.org/',
        description: '德克萨斯州 TxTag 过路费账户管理、余额查询和违规通行费处理入口。',
        types: ['toll'],
        isOfficial: true,
      },
      {
        label: 'TxDMV — 车辆 / 驾照查询',
        url: 'https://www.txdmv.gov/',
        description: '德克萨斯州车辆管理局，提供车辆注册、驾照和交通相关信息查询。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.txdmv.gov/',
  },
  FL: {
    state: 'FL',
    stateNameZh: '佛罗里达州',
    stateNameEn: 'Florida',
    entries: [
      {
        label: 'FLHSMV — 交通罚单 / Violations',
        url: 'https://www.flhsmv.gov/driver-licenses-id-cards/driving-record/traffic-violations/',
        description: '佛罗里达州高速公路安全和机动车辆部（FLHSMV），可查询驾驶违规记录和罚单信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: '佛州法院交通罚单说明',
        url: 'https://www.flcourts.gov/',
        description: '佛罗里达州法院系统。交通罚单通常由各县法院管辖，请前往所在县法院官方网站查询和缴费。',
        types: ['traffic', 'parking'],
        isOfficial: true,
      },
      {
        label: 'SunPass — 佛州过路费 / Toll',
        url: 'https://www.sunpass.com/',
        description: '佛罗里达州 SunPass 过路费账户管理、余额查询和违规通行费处理入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.flhsmv.gov/',
  },
  PA: {
    state: 'PA',
    stateNameZh: '宾夕法尼亚州',
    stateNameEn: 'Pennsylvania',
    entries: [
      {
        label: 'PennDOT 交通罚单',
        url: 'https://www.dmv.pa.gov/VEHICLE-SERVICES/Violations-Suspensions/Pages/default.aspx',
        description: '宾夕法尼亚州 DMV（PennDOT）交通违规和罚单相关信息查询入口。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: 'E-ZPass Pennsylvania — 过路费',
        url: 'https://www.ezpasspa.com/',
        description: '宾夕法尼亚州 E-ZPass 过路费账户管理和查询入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.dmv.pa.gov/',
  },
  MA: {
    state: 'MA',
    stateNameZh: '马萨诸塞州',
    stateNameEn: 'Massachusetts',
    entries: [
      {
        label: 'MA RMV — 交通违规查询',
        url: 'https://www.mass.gov/orgs/registry-of-motor-vehicles',
        description: '马萨诸塞州机动车管理处（RMV），可查询驾驶违规记录和罚单信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: '波士顿停车罚单',
        url: 'https://www.boston.gov/parking/parking-tickets',
        description: '波士顿市停车罚单查询与缴费官方入口。',
        types: ['parking'],
        isOfficial: true,
      },
      {
        label: 'E-ZPass Massachusetts — 过路费',
        url: 'https://www.mass.gov/e-zpass',
        description: '马萨诸塞州 E-ZPass 过路费查询和账户管理入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.mass.gov/orgs/registry-of-motor-vehicles',
  },
  CT: {
    state: 'CT',
    stateNameZh: '康涅狄格州',
    stateNameEn: 'Connecticut',
    entries: [
      {
        label: 'CT DMV — 交通违规',
        url: 'https://portal.ct.gov/DMV',
        description: '康涅狄格州 DMV 官方入口，可查询驾驶违规记录、交通罚单和驾照信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: 'CT E-ZPass — 过路费',
        url: 'https://www.ezpassct.com/',
        description: '康涅狄格州 E-ZPass 过路费账户管理和查询入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://portal.ct.gov/DMV',
  },
  IL: {
    state: 'IL',
    stateNameZh: '伊利诺伊州',
    stateNameEn: 'Illinois',
    entries: [
      {
        label: '芝加哥停车罚单',
        url: 'https://www.chicago.gov/city/en/depts/fin/supp_info/city_collector/parking_citations.html',
        description: '芝加哥市停车罚单官方查询与缴费入口，可通过罚单号或车牌号查询。',
        types: ['parking', 'red-light', 'speed-camera'],
        isOfficial: true,
      },
      {
        label: 'IL SOS — 交通违规查询',
        url: 'https://www.ilsos.gov/departments/drivers/traffic_safety/home.html',
        description: '伊利诺伊州州务卿（SOS）交通安全部门，可查询驾驶违规记录相关信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: 'I-PASS — 伊利诺伊过路费',
        url: 'https://www.illinoistollway.com/i-pass',
        description: '伊利诺伊州 I-PASS 过路费账户管理和查询入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.ilsos.gov/',
  },
  GA: {
    state: 'GA',
    stateNameZh: '佐治亚州',
    stateNameEn: 'Georgia',
    entries: [
      {
        label: 'GA DDS — 驾驶违规记录',
        url: 'https://www.dds.georgia.gov/driver-services/driving-record',
        description: '佐治亚州驾驶员服务部（DDS），可查询驾驶违规记录和罚单相关信息。',
        types: ['traffic', 'unknown'],
        isOfficial: true,
      },
      {
        label: 'Peach Pass — 佐治亚过路费',
        url: 'https://www.peachpass.com/',
        description: '佐治亚州 Peach Pass 过路费账户管理和查询入口。',
        types: ['toll'],
        isOfficial: true,
      },
    ],
    fallbackUrl: 'https://www.dds.georgia.gov/',
  },
  AL: {
    state: 'AL',
    stateNameZh: '阿拉巴马州',
    stateNameEn: 'Alabama',
    entries: [{ label: 'AL DMV 官方入口', url: 'https://www.alabamadmv.org/', description: '阿拉巴马州 DMV 官方网站，可查询驾驶违规记录和相关罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.alabamadmv.org/',
  },
  AK: {
    state: 'AK',
    stateNameZh: '阿拉斯加州',
    stateNameEn: 'Alaska',
    entries: [{ label: 'AK DMV 官方入口', url: 'https://doa.alaska.gov/dmv/', description: '阿拉斯加州 DMV 官方网站，可查询驾驶违规记录和相关罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://doa.alaska.gov/dmv/',
  },
  AZ: {
    state: 'AZ',
    stateNameZh: '亚利桑那州',
    stateNameEn: 'Arizona',
    entries: [{ label: 'AZ MVD 官方入口', url: 'https://www.azdot.gov/motor-vehicles', description: '亚利桑那州机动车管理局（MVD），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.azdot.gov/motor-vehicles',
  },
  AR: {
    state: 'AR',
    stateNameZh: '阿肯色州',
    stateNameEn: 'Arkansas',
    entries: [{ label: 'AR DFA DMV 官方入口', url: 'https://www.dfa.arkansas.gov/motorvehicles/', description: '阿肯色州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dfa.arkansas.gov/motorvehicles/',
  },
  CO: {
    state: 'CO',
    stateNameZh: '科罗拉多州',
    stateNameEn: 'Colorado',
    entries: [{ label: 'CO DMV 官方入口', url: 'https://dmv.colorado.gov/', description: '科罗拉多州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dmv.colorado.gov/',
  },
  DE: {
    state: 'DE',
    stateNameZh: '特拉华州',
    stateNameEn: 'Delaware',
    entries: [{ label: 'DE DMV 官方入口', url: 'https://www.dmv.de.gov/', description: '特拉华州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dmv.de.gov/',
  },
  HI: {
    state: 'HI',
    stateNameZh: '夏威夷州',
    stateNameEn: 'Hawaii',
    entries: [{ label: 'HI DMV 官方入口', url: 'https://hidot.hawaii.gov/highways/', description: '夏威夷州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://hidot.hawaii.gov/highways/',
  },
  ID: {
    state: 'ID',
    stateNameZh: '爱达荷州',
    stateNameEn: 'Idaho',
    entries: [{ label: 'ID ITD DMV 官方入口', url: 'https://itd.idaho.gov/dmv/', description: '爱达荷州交通部 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://itd.idaho.gov/dmv/',
  },
  IN: {
    state: 'IN',
    stateNameZh: '印第安纳州',
    stateNameEn: 'Indiana',
    entries: [{ label: 'IN BMV 官方入口', url: 'https://www.in.gov/bmv/', description: '印第安纳州机动车辆局（BMV），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.in.gov/bmv/',
  },
  IA: {
    state: 'IA',
    stateNameZh: '爱荷华州',
    stateNameEn: 'Iowa',
    entries: [{ label: 'IA DOT DMV 官方入口', url: 'https://iowadot.gov/mvd', description: '爱荷华州交通部机动车部门（MVD），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://iowadot.gov/mvd',
  },
  KS: {
    state: 'KS',
    stateNameZh: '堪萨斯州',
    stateNameEn: 'Kansas',
    entries: [{ label: 'KS DMV 官方入口', url: 'https://www.ksrevenue.gov/dovindex.html', description: '堪萨斯州机动车辆部门，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.ksrevenue.gov/dovindex.html',
  },
  KY: {
    state: 'KY',
    stateNameZh: '肯塔基州',
    stateNameEn: 'Kentucky',
    entries: [{ label: 'KY TC 官方入口', url: 'https://transportation.ky.gov/DriversLicensing/Pages/default.aspx', description: '肯塔基州交通部驾驶员许可证部门，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://transportation.ky.gov/DriversLicensing/Pages/default.aspx',
  },
  LA: {
    state: 'LA',
    stateNameZh: '路易斯安那州',
    stateNameEn: 'Louisiana',
    entries: [{ label: 'LA OMV 官方入口', url: 'https://www.expresslane.org/', description: '路易斯安那州机动车辆办公室（OMV），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.expresslane.org/',
  },
  ME: {
    state: 'ME',
    stateNameZh: '缅因州',
    stateNameEn: 'Maine',
    entries: [{ label: 'ME BMV 官方入口', url: 'https://www.maine.gov/sos/bmv/', description: '缅因州机动车辆局（BMV），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.maine.gov/sos/bmv/',
  },
  MD: {
    state: 'MD',
    stateNameZh: '马里兰州',
    stateNameEn: 'Maryland',
    entries: [
      { label: 'MD MVA 官方入口', url: 'https://mva.maryland.gov/', description: '马里兰州机动车管理局（MVA），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'unknown'] },
      { label: 'E-ZPass Maryland — 过路费', url: 'https://www.mdta.maryland.gov/E-ZPass_Maryland/', description: '马里兰州 E-ZPass 过路费账户管理入口。', types: ['toll'] },
    ],
    fallbackUrl: 'https://mva.maryland.gov/',
  },
  MI: {
    state: 'MI',
    stateNameZh: '密歇根州',
    stateNameEn: 'Michigan',
    entries: [{ label: 'MI SOS 官方入口', url: 'https://www.michigan.gov/sos/', description: '密歇根州州务卿（SOS），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.michigan.gov/sos/',
  },
  MN: {
    state: 'MN',
    stateNameZh: '明尼苏达州',
    stateNameEn: 'Minnesota',
    entries: [{ label: 'MN DVS 官方入口', url: 'https://dps.mn.gov/divisions/dvs/Pages/default.aspx', description: '明尼苏达州驾驶员和车辆服务部（DVS），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dps.mn.gov/divisions/dvs/Pages/default.aspx',
  },
  MS: {
    state: 'MS',
    stateNameZh: '密西西比州',
    stateNameEn: 'Mississippi',
    entries: [{ label: 'MS DPS 官方入口', url: 'https://www.dps.state.ms.us/', description: '密西西比州公共安全部，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dps.state.ms.us/',
  },
  MO: {
    state: 'MO',
    stateNameZh: '密苏里州',
    stateNameEn: 'Missouri',
    entries: [{ label: 'MO DOR 官方入口', url: 'https://dor.mo.gov/motorv/', description: '密苏里州税务部机动车部门，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dor.mo.gov/motorv/',
  },
  MT: {
    state: 'MT',
    stateNameZh: '蒙大拿州',
    stateNameEn: 'Montana',
    entries: [{ label: 'MT DMV 官方入口', url: 'https://dojmt.gov/driving/', description: '蒙大拿州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dojmt.gov/driving/',
  },
  NE: {
    state: 'NE',
    stateNameZh: '内布拉斯加州',
    stateNameEn: 'Nebraska',
    entries: [{ label: 'NE DMV 官方入口', url: 'https://dmv.nebraska.gov/', description: '内布拉斯加州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dmv.nebraska.gov/',
  },
  NV: {
    state: 'NV',
    stateNameZh: '内华达州',
    stateNameEn: 'Nevada',
    entries: [{ label: 'NV DMV 官方入口', url: 'https://www.dmvnv.com/', description: '内华达州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dmvnv.com/',
  },
  NH: {
    state: 'NH',
    stateNameZh: '新罕布什尔州',
    stateNameEn: 'New Hampshire',
    entries: [{ label: 'NH DMV 官方入口', url: 'https://www.nh.gov/safety/divisions/dmv/', description: '新罕布什尔州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.nh.gov/safety/divisions/dmv/',
  },
  NM: {
    state: 'NM',
    stateNameZh: '新墨西哥州',
    stateNameEn: 'New Mexico',
    entries: [{ label: 'NM MVD 官方入口', url: 'https://www.mvd.newmexico.gov/', description: '新墨西哥州机动车部门（MVD），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.mvd.newmexico.gov/',
  },
  NC: {
    state: 'NC',
    stateNameZh: '北卡罗来纳州',
    stateNameEn: 'North Carolina',
    entries: [{ label: 'NC DMV 官方入口', url: 'https://www.ncdot.gov/dmv/', description: '北卡罗来纳州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.ncdot.gov/dmv/',
  },
  ND: {
    state: 'ND',
    stateNameZh: '北达科他州',
    stateNameEn: 'North Dakota',
    entries: [{ label: 'ND DMV 官方入口', url: 'https://www.dot.nd.gov/divisions/driverslicense/driverslicense.htm', description: '北达科他州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dot.nd.gov/divisions/driverslicense/driverslicense.htm',
  },
  OH: {
    state: 'OH',
    stateNameZh: '俄亥俄州',
    stateNameEn: 'Ohio',
    entries: [{ label: 'OH BMV 官方入口', url: 'https://www.bmv.ohio.gov/', description: '俄亥俄州机动车辆局（BMV），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.bmv.ohio.gov/',
  },
  OK: {
    state: 'OK',
    stateNameZh: '俄克拉何马州',
    stateNameEn: 'Oklahoma',
    entries: [{ label: 'OK DPS 官方入口', url: 'https://www.ok.gov/dps/', description: '俄克拉何马州公共安全部，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.ok.gov/dps/',
  },
  OR: {
    state: 'OR',
    stateNameZh: '俄勒冈州',
    stateNameEn: 'Oregon',
    entries: [{ label: 'OR DMV 官方入口', url: 'https://www.oregon.gov/odot/dmv/pages/index.aspx', description: '俄勒冈州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.oregon.gov/odot/dmv/pages/index.aspx',
  },
  RI: {
    state: 'RI',
    stateNameZh: '罗德岛州',
    stateNameEn: 'Rhode Island',
    entries: [{ label: 'RI DMV 官方入口', url: 'https://dmv.ri.gov/', description: '罗德岛州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dmv.ri.gov/',
  },
  SC: {
    state: 'SC',
    stateNameZh: '南卡罗来纳州',
    stateNameEn: 'South Carolina',
    entries: [{ label: 'SC DMV 官方入口', url: 'https://www.scdmvonline.com/', description: '南卡罗来纳州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.scdmvonline.com/',
  },
  SD: {
    state: 'SD',
    stateNameZh: '南达科他州',
    stateNameEn: 'South Dakota',
    entries: [{ label: 'SD DMV 官方入口', url: 'https://dps.sd.gov/driver-licensing', description: '南达科他州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dps.sd.gov/driver-licensing',
  },
  TN: {
    state: 'TN',
    stateNameZh: '田纳西州',
    stateNameEn: 'Tennessee',
    entries: [{ label: 'TN DOS 官方入口', url: 'https://www.tn.gov/safety/dl.html', description: '田纳西州安全部，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.tn.gov/safety/dl.html',
  },
  UT: {
    state: 'UT',
    stateNameZh: '犹他州',
    stateNameEn: 'Utah',
    entries: [{ label: 'UT DMV 官方入口', url: 'https://dmv.utah.gov/', description: '犹他州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dmv.utah.gov/',
  },
  VT: {
    state: 'VT',
    stateNameZh: '佛蒙特州',
    stateNameEn: 'Vermont',
    entries: [{ label: 'VT DMV 官方入口', url: 'https://dmv.vermont.gov/', description: '佛蒙特州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://dmv.vermont.gov/',
  },
  VA: {
    state: 'VA',
    stateNameZh: '弗吉尼亚州',
    stateNameEn: 'Virginia',
    entries: [
      { label: 'VA DMV 官方入口', url: 'https://www.dmv.virginia.gov/', description: '弗吉尼亚州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'unknown'] },
      { label: 'E-ZPass Virginia — 过路费', url: 'https://www.ezpassva.com/', description: '弗吉尼亚州 E-ZPass 过路费账户管理入口。', types: ['toll'] },
    ],
    fallbackUrl: 'https://www.dmv.virginia.gov/',
  },
  WA: {
    state: 'WA',
    stateNameZh: '华盛顿州',
    stateNameEn: 'Washington',
    entries: [
      { label: 'WA DOL 官方入口', url: 'https://www.dol.wa.gov/', description: '华盛顿州许可证部门（DOL），可查询驾驶违规记录和罚单信息。', types: ['traffic', 'unknown'] },
      { label: '西雅图停车罚单', url: 'https://www.seattle.gov/finance-and-administrative-services/taxes-and-fees/parking-enforcement', description: '西雅图市停车罚单查询与缴费入口。', types: ['parking'] },
      { label: 'Good To Go! — 华盛顿过路费', url: 'https://mygoodtogo.com/', description: '华盛顿州 Good To Go! 过路费账户管理入口。', types: ['toll'] },
    ],
    fallbackUrl: 'https://www.dol.wa.gov/',
  },
  WV: {
    state: 'WV',
    stateNameZh: '西弗吉尼亚州',
    stateNameEn: 'West Virginia',
    entries: [{ label: 'WV DMV 官方入口', url: 'https://transportation.wv.gov/DMV/Pages/default.aspx', description: '西弗吉尼亚州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://transportation.wv.gov/DMV/Pages/default.aspx',
  },
  WI: {
    state: 'WI',
    stateNameZh: '威斯康星州',
    stateNameEn: 'Wisconsin',
    entries: [{ label: 'WI DMV 官方入口', url: 'https://www.dot.wisconsin.gov/drivers/', description: '威斯康星州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dot.wisconsin.gov/drivers/',
  },
  WY: {
    state: 'WY',
    stateNameZh: '怀俄明州',
    stateNameEn: 'Wyoming',
    entries: [{ label: 'WY DMV 官方入口', url: 'https://www.dot.state.wy.us/home/driver_license_records.html', description: '怀俄明州 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'parking', 'unknown'] }],
    fallbackUrl: 'https://www.dot.state.wy.us/home/driver_license_records.html',
  },
  DC: {
    state: 'DC',
    stateNameZh: '华盛顿特区',
    stateNameEn: 'Washington D.C.',
    entries: [
      { label: 'DC DMV 官方入口', url: 'https://dmv.dc.gov/', description: '华盛顿特区 DMV 官方网站，可查询驾驶违规记录和罚单信息。', types: ['traffic', 'unknown'] },
      { label: 'DC 停车罚单查询', url: 'https://dmv.dc.gov/service/pay-ticket', description: '华盛顿特区停车罚单查询与缴费官方入口。', types: ['parking'] },
    ],
    fallbackUrl: 'https://dmv.dc.gov/',
  },
}

// Ordered list: common states first, then the rest
export const COMMON_STATES = ['NY', 'NJ', 'CA', 'TX', 'FL', 'PA', 'MA', 'CT', 'IL', 'GA']
export const ALL_STATES = [
  ...COMMON_STATES,
  'AL', 'AK', 'AZ', 'AR', 'CO', 'DE', 'HI', 'ID', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'RI',
  'SC', 'SD', 'TN', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  parking: '停车罚单 Parking Ticket',
  'red-light': '闯红灯拍照 Red Light Camera',
  'speed-camera': '超速拍照 Speed Camera',
  traffic: '交通罚单 / 法院罚单 Traffic Ticket',
  toll: '过路费 / E-ZPass / Toll',
  unknown: '不确定',
}

export const PREPARE_DOCS: Record<TicketType, string[]> = {
  parking: ['罚单号（Ticket Number / Summons Number）', '车牌号', '车辆注册信息', '付款方式（信用卡/借记卡）'],
  'red-light': ['罚单号（Violation Number）', '车牌号', '车辆注册信息', '付款方式'],
  'speed-camera': ['罚单号（Violation Number）', '车牌号', '车辆注册信息', '付款方式'],
  traffic: ['驾照号（License Number）', '罚单号 / 传票号（Ticket / Summons Number）', '法院名称和案件号', '付款方式'],
  toll: ['车牌号', 'E-ZPass 账号（如有）', '违规通行日期和路段', '付款方式'],
  unknown: ['罚单号或传票号', '车牌号', '驾照号', '付款方式'],
}

export const FAQ = [
  {
    q: '纽约停车罚单怎么查询？',
    a: '纽约市停车罚单可通过 NYC Finance CityPay 查询，支持按罚单号（Ticket Number）或车牌号（Plate Number）查找与缴费。',
  },
  {
    q: '红灯/超速摄像头罚单在哪里查？',
    a: '纽约市红灯与超速摄像头罚单也可在 NYC Finance CityPay 入口查询和处理，进入后按提示选择对应票种。',
  },
  {
    q: '交通违规（Moving Violation）应该去哪里处理？',
    a: '涉及交通违规（如闯红灯、超速等出庭类罚单）通常通过 NY DMV TVB 系统处理，具体以罚单上的法院或 TVB 指引为准。',
  },
  {
    q: '美国停车罚单怎么查询？',
    a: '美国停车罚单通常由发出罚单的城市或县财政局、停车管理部门管理。您需要前往该城市官方网站，输入罚单号或车牌号进行查询。纽约市可通过 NYC Finance CityPay 系统查询。OpenAA 不直接查询罚单，仅提供官方入口导航。',
  },
]

// Popular state entries for the "热门州入口" section
export const POPULAR_STATES = ['NY', 'NJ', 'CA', 'TX', 'FL']

// ---------------------------------------------------------------------------
// Helper: get recommended entries for a state + ticket type
// ---------------------------------------------------------------------------
export function getRecommendedEntries(state: string, ticketType: TicketType): Entry[] {
  const data = stateDataMap[state]
  if (!data) return []

  if (ticketType === 'unknown') {
    // Return top 1-3 most relevant entries
    return data.entries.slice(0, 3)
  }

  const matched = data.entries.filter((e) => e.types.includes(ticketType))
  if (matched.length > 0) return matched

  // Fallback: return all entries
  return data.entries.slice(0, 2)
}
