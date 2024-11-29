extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use js_sys::*;
use namada_sdk::{
    ibc::decode_message,
    token,
    //systems::trans_token,
};

#[wasm_bindgen]
pub struct Decode;

#[wasm_bindgen]
impl Decode {
    #[wasm_bindgen] pub fn ibc (source: Uint8Array) -> Result<JsString, Error> {
        let mut buffer = vec![0u8;source.length() as usize];
        source.copy_to(buffer.as_mut_slice());
        let decoded = decode_message::<()>(&buffer[..]).map_err(|e|Error::new(&format!("{e}")))?;
        Ok(JsString::from(format!("{decoded:?}")))
    }
}
