import * as i18next from "i18next";

i18next.init({
    lng: "ru",
    resources: {
        ru: {
            translation: {
                "Export": "translated"
            }
        }
    },
    interpolation: {
      escapeValue: false,
    }
});

export const _ = i18next.t;
