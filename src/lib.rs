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
    #[wasm_bindgen] pub fn ibc (source: Uint8Array) -> Result<Object, Error> {
        let mut buffer = vec![0u8;source.length() as usize];
        source.copy_to(buffer.as_mut_slice());
        let decoded = decode_message::<()>(&buffer[..]).map_err(|e|Error::new(&format!("{e}")))?;
        panic!("{decoded:?}");
        //let encoded = include_bytes!("14504-CreateClient.bin");
        //let decoded = decode_message::<()>(&encoded[..]).unwrap();
        //println!("{decoded:#?}");

        //let encoded = include_bytes!("181817-CreateClient.bin");
        //let decoded = decode_message::<()>(&encoded[..]).unwrap();
        //println!("{decoded:#?}");

        ////let encoded = include_bytes!("181839-ConnectionOpenInit.bin");
        ////let decoded = decode_message::<trans_token::Keys>(&encoded[..]).unwrap();
        ////println!("{decoded:#?}");

        //let encoded = include_bytes!("181841-UpdateClient.bin");
        //let decoded = decode_message::<()>(&encoded[..]).unwrap();
        //println!("{decoded:#?}");

        //let encoded = include_bytes!("181846-UpdateClient.bin");
        //let decoded = decode_message::<()>(&encoded[..]).unwrap();
        //println!("{decoded:#?}");

        //let encoded = include_bytes!("181849-ChannelOpenInit.bin");
        //let decoded = decode_message::<()>(&encoded[..]).unwrap();
        //println!("{decoded:#?}");
    }
}
