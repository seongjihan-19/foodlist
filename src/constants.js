// DB의 CHECK 제약과 같은 목록 (schema.sql과 맞춰서 관리)
export const CATEGORIES = ['농산물', '가공-건조', '가공-액상', '냉동']
export const UNITS = ['g', 'kg', 'ml']
export const ALLERGEN_STATUSES = ['있음', '없음', '미기재']
export const STAGES = ['개봉 전', '개봉 후', '수령 후']
export const STORAGE_TYPES = ['상온', '냉장', '냉동']
export const DURATION_UNITS = ['일', '주', '개월']
export const NOTE_TYPES = ['금지', '보관팁', '섭취안내', '조리', '섭취주의', '참고']
export const CONTACT_TYPES = ['함유', '교차오염']

export const PRODUCT_CODE_PATTERN = /^P-\d{4}$/
