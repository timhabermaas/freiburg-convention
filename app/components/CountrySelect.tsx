import { Autocomplete, Box, FormControl, TextField } from "@mui/material";
import { COUNTRIES } from "~/constants";
import * as i18n from "~/i18n";

interface CountrySelectProps {
  locale: i18n.SupportedLocales;
  name: string;
  label: string;
  error?: boolean;
  helperText?: string[];
  defaultValue?: string;
}

export function CountrySelect(props: CountrySelectProps) {
  const defaultCountry = i18n
    .sortedCountryList(COUNTRIES, props.locale)
    .find(({ label }) => label === props.defaultValue);

  return (
    <FormControl fullWidth>
      <Autocomplete
        disablePortal
        options={i18n.sortedCountryList(COUNTRIES, props.locale)}
        getOptionLabel={(option) => option.label}
        defaultValue={defaultCountry}
        renderOption={(props, option) => (
          <Box
            component="li"
            sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
            {...props}
          >
            <img
              loading="lazy"
              width="20"
              src={`https://flagcdn.com/w20/${option.value.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w40/${option.value.toLowerCase()}.png 2x`}
              alt=""
            />
            {option.label} ({option.value})
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            name={props.name}
            label={props.label}
            defaultValue={defaultCountry?.label}
            error={props.error}
            helperText={props.helperText}
          />
        )}
      />
    </FormControl>
  );
}
