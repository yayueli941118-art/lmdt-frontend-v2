export const APP_VERSION = __APP_VERSION__
export const BUILD_MODE = __BUILD_MODE__
export const RELEASE_LABEL = `v${APP_VERSION}`
export const PRODUCT_VERSION = Object.freeze({
  name: __ANONYMOUS_BUILD__ ? 'Course Lab' : 'LMDT',
  version: APP_VERSION,
  label: __ANONYMOUS_BUILD__ ? `Course Lab ${APP_VERSION}` : `LMDT ${APP_VERSION}`,
  meaning: '前端产品与课堂功能发布版本',
})
export const DOMAIN_MODEL_FAMILY_VERSION = '2.1.0'
export const RECORD_SCHEMA_VERSION = 2
export const VERSION_BOUNDARY = '系统版本描述页面功能；领域模型版本描述公式与计算实现；记录结构版本描述本地数据兼容性。三者版本号不要求相同。'
