extern crate wasm_bindgen;
extern crate console_error_panic_hook;
use wasm_bindgen::prelude::*;
use js_sys::*;

macro_rules! to_object {
    ($($id:literal = $val:expr),* $(,)?) => {{
        let object = Object::new();
        $(Reflect::set(&object, &$id.into(), &$val.to_js()?)?;)*
        object
    }}
}

#[wasm_bindgen]
pub struct Decode;

#[wasm_bindgen]
impl Decode {
    #[wasm_bindgen] pub fn ibc (source: Uint8Array) -> Result<Object, Error> {
        console_error_panic_hook::set_once();

        use namada_sdk::{
            ibc::{
                decode_message,
                IbcMessage,
                MsgTransfer    as IbcMsgTransfer,
                MsgNftTransfer as IbcMsgNftTransfer,
                core::{
                    handler::types::msgs::MsgEnvelope,
                    client::context::types::msgs::*,
                    connection::types::msgs::*,
                    channel::types::msgs::*
                },
                apps::{
                    transfer::types::msgs::transfer::MsgTransfer,
                    nft_transfer::types::msgs::transfer::MsgTransfer as MsgNftTransfer,
                },
            },
            token,
            //systems::trans_token,
        };
        let mut buffer = vec![0u8;source.length() as usize];
        source.copy_to(buffer.as_mut_slice());
        let message = decode_message::<()>(&buffer[..]).map_err(|e|Error::new(&format!("{e}")))?;
        let decoded = match message {

            IbcMessage::Envelope(message) => match *message {

                MsgEnvelope::Client(message) => match message {
                    ClientMsg::CreateClient(MsgCreateClient {
                        client_state,
                        consensus_state,
                        signer,
                    }) => to_object! {
                        "type"           = "envelope.client.create",
                        "clientState"    = client_state,
                        "consensusState" = consensus_state,
                        "signer"         = signer,
                    },
                    ClientMsg::UpdateClient(MsgUpdateClient {
                        client_id,
                        client_message,
                        signer,
                    }) => to_object! {
                        "type"           = "envelope.client.update",
                        "clientId"      = client_id,
                        "clientMessage" = client_message,
                        "signer"        = signer,
                    },
                    ClientMsg::Misbehaviour(MsgSubmitMisbehaviour {
                        client_id,
                        misbehaviour,
                        signer,
                    }) => to_object! {
                        "type"           = "envelope.client.misbehaviour",
                        "clientId"     = client_id,
                        "misbehaviour" = misbehaviour,
                        "signer"       = signer,
                    },
                    ClientMsg::UpgradeClient(MsgUpgradeClient {
                        client_id,
                        upgraded_client_state,
                        upgraded_consensus_state,
                        proof_upgrade_client,
                        proof_upgrade_consensus_state,
                        signer,
                    }) => to_object! {
                        "type"                       = "envelope.client.upgrade",
                        "clientId"                   = client_id,
                        "upgradedClientState"        = upgraded_client_state,
                        "upgradedConsensusState"     = upgraded_consensus_state,
                        "proofUpgradeClient"         = proof_upgrade_client,
                        "proofUpgradeConsensusState" = proof_upgrade_consensus_state,
                        "signer"                     = signer,
                    },
                    ClientMsg::RecoverClient(MsgRecoverClient {
                        subject_client_id,
                        substitute_client_id,
                        signer,
                    }) => to_object! {
                        "type"               = "envelope.client.recover",
                        "subjectClientId"    = subject_client_id,
                        "substituteClientId" = substitute_client_id,
                        "signer"             = signer,
                    },
                },

                MsgEnvelope::Connection(message) => match message {
                    ConnectionMsg::OpenInit(MsgConnectionOpenInit {
                        client_id_on_a,
                        counterparty,
                        version,
                        delay_period,
                        signer,
                    }) => to_object! {
                        "type"         = "envelope.connection.open_init",
                        "clientIdOnA"  = client_id_on_a,
                        "counterparty" = counterparty,
                        "version"      = version,
                        "delayPeriod"  = delay_period,
                        "signer"       = signer,
                    },
                    ConnectionMsg::OpenTry(MsgConnectionOpenTry {
                        client_id_on_b,
                        client_state_of_b_on_a,
                        counterparty,
                        versions_on_a,
                        proof_conn_end_on_a,
                        proof_client_state_of_b_on_a,
                        proof_consensus_state_of_b_on_a,
                        proofs_height_on_a,
                        consensus_height_of_b_on_a,
                        delay_period,
                        signer,
                        proof_consensus_state_of_b,
                        previous_connection_id,
                    }) => to_object! {
                        "type"                      = "envelope.connection.open_try",
                        "clientIdOnB"               = client_id_on_b,
                        "clientstateOfBOnA"         = client_state_of_b_on_a,
                        "counterparty"              = counterparty,
                        "versionsOnA"               = versions_on_a,
                        "proofConnEndOnA"           = proof_conn_end_on_a,
                        "proofClientStateOfBOnA"    = proof_client_state_of_b_on_a,
                        "froofConsensusStateOfBOnA" = proof_consensus_state_of_b_on_a,
                        "proofsHeightOnA"           = proofs_height_on_a,
                        "consensusheightOfBOnA"     = consensus_height_of_b_on_a,
                        "delayPeriod"               = delay_period,
                        "signer"                    = signer,
                        "proofConsensusStateOfB"    = proof_consensus_state_of_b,
                        "previousConnectionId"      = previous_connection_id,
                    },
                    ConnectionMsg::OpenAck(MsgConnectionOpenAck {
                        conn_id_on_a,
                        conn_id_on_b,
                        client_state_of_a_on_b,
                        proof_conn_end_on_b,
                        proof_client_state_of_a_on_b,
                        proof_consensus_state_of_a_on_b,
                        proofs_height_on_b,
                        consensus_height_of_a_on_b,
                        version,
                        signer,
                        proof_consensus_state_of_a,
                    }) => to_object! {
                        "type"                      = "envelope.connection.open_ack",
                        "connIdOnA"                 = conn_id_on_a,
                        "connIdOnB"                 = conn_id_on_b,
                        "clientStateOfAOnB"         = client_state_of_a_on_b,
                        "proofConnEndOnB"           = proof_conn_end_on_b,
                        "proofClientStateOfAOnB"    = proof_client_state_of_a_on_b,
                        "proofConsensusStateOfAOnB" = proof_consensus_state_of_a_on_b,
                        "proofsHeightOnB"           = proofs_height_on_b,
                        "consensusHeightOfAOnB"     = consensus_height_of_a_on_b,
                        "version"                   = version,
                        "signer"                    = signer,
                        "proofConsensusStateOfA"    = proof_consensus_state_of_a,
                    },
                    ConnectionMsg::OpenConfirm(MsgConnectionOpenConfirm {
                        conn_id_on_b,
                        proof_conn_end_on_a,
                        proof_height_on_a,
                        signer,
                    }) => to_object! {
                        "type"            = "envelope.connection.open_confirm",
                        "connIdOnB"       = conn_id_on_b,
                        "proofConnEndOnA" = proof_conn_end_on_a,
                        "proofHeightOnA"  = proof_height_on_a,
                        "signer"          = signer,
                    },
                },

                MsgEnvelope::Channel(message) => match message {
                    ChannelMsg::OpenInit(MsgChannelOpenInit {
                        port_id_on_a,
                        connection_hops_on_a,
                        port_id_on_b,
                        ordering,
                        signer,
                        version_proposal,
                    }) => to_object! {
                        "type"              = "envelope.channel.open_init",
                        "portIdOnA"         = port_id_on_a,
                        "connectionHopsOnA" = connection_hops_on_a,
                        "portIdOnB"         = port_id_on_b,
                        "ordering"          = ordering,
                        "signer"            = signer,
                        "versionProposal"   = version_proposal,
                    },
                    ChannelMsg::OpenTry(MsgChannelOpenTry {
                        port_id_on_b,
                        connection_hops_on_b,
                        port_id_on_a,
                        chan_id_on_a,
                        version_supported_on_a,
                        proof_chan_end_on_a,
                        proof_height_on_a,
                        ordering,
                        signer,
                        version_proposal,
                    }) => to_object! {
                        "type"                = "envelope.channel.open_try",
                        "portIdOnB"           = port_id_on_b,
                        "connectionHopsOnB"   = connection_hops_on_b,
                        "portIdOnA"           = port_id_on_a,
                        "chanIdOnA"           = chan_id_on_a,
                        "versionSupportedOnA" = version_supported_on_a,
                        "proofChanEndOnA"     = proof_chan_end_on_a,
                        "proofHeightOnA"      = proof_height_on_a,
                        "ordering"            = ordering,
                        "signer"              = signer,
                        "versionProposal"     = version_proposal,
                    },
                    ChannelMsg::OpenAck(MsgChannelOpenAck {
                        port_id_on_a,
                        chan_id_on_a,
                        chan_id_on_b,
                        version_on_b,
                        proof_chan_end_on_b,
                        proof_height_on_b,
                        signer,
                    }) => to_object! {
                        "type"            = "envelope.channel.open_ack",
                        "portIdOnA"       = port_id_on_a,
                        "chanIdOnB"       = chan_id_on_a,
                        "chanIdOnB"       = chan_id_on_b,
                        "versionOnB"      = version_on_b,
                        "proofChanEndOnB" = proof_chan_end_on_b,
                        "proofHeightOnB"  = proof_height_on_b,
                        "signer"          = signer,
                    },
                    ChannelMsg::OpenConfirm(MsgChannelOpenConfirm {
                        port_id_on_b,
                        chan_id_on_b,
                        proof_chan_end_on_a,
                        proof_height_on_a,
                        signer,
                    }) => to_object! {
                        "type"            = "envelope.channel.open_confirm",
                        "portIdOnB"       = port_id_on_b,
                        "chanIdOnB"       = chan_id_on_b,
                        "proofChanEndOnA" = proof_chan_end_on_a,
                        "proofHeightOnA"  = proof_height_on_a,
                        "signer"          = signer,
                    },
                    ChannelMsg::CloseInit(MsgChannelCloseInit {
                        port_id_on_a,
                        chan_id_on_a,
                        signer,
                    }) => to_object! {
                        "type"      = "envelope.channel.close_init",
                        "portIdOnA" = port_id_on_a,
                        "chanIdOnA" = chan_id_on_a,
                        "signer"    = signer,
                    },
                    ChannelMsg::CloseConfirm(MsgChannelCloseConfirm {
                        port_id_on_b,
                        chan_id_on_b,
                        proof_chan_end_on_a,
                        proof_height_on_a,
                        signer,
                    }) => to_object! {
                        "type"            = "envelope.channel.close_confirm",
                        "portIdOnB"       = port_id_on_b,
                        "chanIdOnB"       = chan_id_on_b,
                        "proofChanEndOnA" = proof_chan_end_on_a,
                        "proofHeightOnA"  = proof_height_on_a,
                        "signer"          = signer,
                    },
                },

                MsgEnvelope::Packet(message) => match message {
                    PacketMsg::Recv(MsgRecvPacket {
                        packet,
                        proof_commitment_on_a,
                        proof_height_on_a,
                        signer,
                    }) => to_object! {
                        "type"               = "envelope.packet.recv",
                        "packet"             = packet,
                        "proofCommitmentOnA" = proof_commitment_on_a,
                        "proofHeightOnA"     = proof_height_on_a,
                        "signer"             = signer,
                    },
                    PacketMsg::Ack(MsgAcknowledgement {
                        packet,
                        acknowledgement,
                        proof_acked_on_b,
                        proof_height_on_b,
                        signer,
                    }) => to_object! {
                        "type"            = "envelope.packet.ack",
                        "packet"          = packet,
                        "acknowledgement" = acknowledgement,
                        "proofAckedOnB"   = proof_acked_on_b,
                        "proofHeightOnB"  = proof_height_on_b,
                        "signer"          = signer,
                    },
                    PacketMsg::Timeout(MsgTimeout {
                        packet,
                        next_seq_recv_on_b,
                        proof_unreceived_on_b,
                        proof_height_on_b,
                        signer,
                    }) => to_object! {
                        "type"               = "envelope.packet.timeout",
                        "packet"             = packet,
                        "nextSeqRecvOnB"     = next_seq_recv_on_b,
                        "proofUnreceivedOnB" = proof_unreceived_on_b,
                        "proofHeightOnB"     = proof_height_on_b,
                        "signer"             = signer,
                    },
                    PacketMsg::TimeoutOnClose(MsgTimeoutOnClose {
                        packet,
                        next_seq_recv_on_b,
                        proof_unreceived_on_b,
                        proof_close_on_b,
                        proof_height_on_b,
                        signer,
                    }) => to_object! {
                        "type"               = "envelope.packet.timeout_on_close",
                        "packet"             = packet,
                        "nextSeqRecvOnB"     = next_seq_recv_on_b,
                        "proofUnreceivedOnB" = proof_unreceived_on_b,
                        "proofCloseOnB"      = proof_close_on_b,
                        "proofHeightOnB"     = proof_height_on_b,
                        "signer"             = signer,
                    },
                },

            },

            IbcMessage::Transfer(boxed_message) => {
                let IbcMsgTransfer {
                    message: MsgTransfer {
                        port_id_on_a,
                        chan_id_on_a,
                        packet_data,
                        timeout_height_on_b,
                        timeout_timestamp_on_b,
                    },
                    transfer,
                } = *boxed_message;
                to_object! {
                    "type"    = "transfer",
                    "message" = to_object! {
                        "portIdOnA"           = port_id_on_a,
                        "chanIdOnA"           = chan_id_on_a,
                        "packetData"          = packet_data,
                        "timeoutHeightOnB"    = timeout_height_on_b,
                        "timeoutTimestampOnB" = timeout_timestamp_on_b,
                    },
                    "transfer" = transfer,
                }
            },

            IbcMessage::NftTransfer(message) => {
                let IbcMsgNftTransfer {
                    message: MsgNftTransfer {
                        port_id_on_a,
                        chan_id_on_a,
                        packet_data,
                        timeout_height_on_b,
                        timeout_timestamp_on_b,
                    },
                    transfer,
                } = message;
                to_object! {
                    "type"    = "nft_transfer",
                    "message" = to_object! {
                        "portIdOnA"           = port_id_on_a,
                        "chanIdOnA"           = chan_id_on_a,
                        "packetData"          = packet_data,
                        "timeoutHeightOnB"    = timeout_height_on_b,
                        "timeoutTimestampOnB" = timeout_timestamp_on_b,
                    },
                    "transfer" = transfer,
                }
            },
        };
        Ok(decoded)
    }
}

pub trait ToJS {
    fn to_js (&self) -> Result<JsValue, Error>;
}

impl ToJS for () {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::UNDEFINED)
    }
}

impl ToJS for &str {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.to_string()))
    }
}

impl<T: ToJS> ToJS for Option<T> {
    fn to_js (&self) -> Result<JsValue, Error> {
        if let Some(value) = self {
            value.to_js()
        } else {
            Ok(JsValue::NULL)
        }
    }
}

impl<T: ToJS> ToJS for Vec<T> {
    fn to_js (&self) -> Result<JsValue, Error> {
        let array = Array::new();
        for item in self.iter() {
            array.push(&item.to_js()?);
        }
        Ok(JsValue::from(&array))
    }
}

impl ToJS for Vec<u8> {
    fn to_js (&self) -> Result<JsValue, Error> {
        let array = Uint8Array::new_with_length(self.len() as u32);
        array.copy_from(self.as_slice());
        Ok(JsValue::from(array))
    }
}

impl ToJS for u32 {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(*self))
    }
}

impl ToJS for u64 {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(*self))
    }
}

impl ToJS for String {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self))
    }
}

impl ToJS for std::time::Duration {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self:?}")))
    }
}

impl ToJS for Object {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self))
    }
}

impl ToJS for namada_sdk::ibc::core::commitment_types::commitment::CommitmentPrefix {
    fn to_js (&self) -> Result<JsValue, Error> {
        let bytes = self.as_bytes();
        let array = Uint8Array::new_with_length(bytes.len() as u32);
        array.copy_from(bytes);
        Ok(JsValue::from(array))
    }
}

impl ToJS for namada_sdk::ibc::core::channel::types::acknowledgement::Acknowledgement {
    fn to_js (&self) -> Result<JsValue, Error> {
        let bytes = self.as_bytes();
        let array = Uint8Array::new_with_length(bytes.len() as u32);
        array.copy_from(bytes);
        Ok(JsValue::from(&array))
    }
}

impl ToJS for namada_sdk::ibc::core::channel::types::channel::Order {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::ibc::core::channel::types::packet::Packet {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::core::channel::types::timeout::TimeoutHeight {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(match self {
            Self::Never => JsValue::from("never"),
            Self::At(height) => JsValue::from(height.to_js()?)
        })
    }
}

impl ToJS for namada_sdk::ibc::core::channel::types::timeout::TimeoutTimestamp {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::core::client::types::Height {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "revision_number" = self.revision_number(),
            "revision_height" = self.revision_height(),
        }))
    }
}

impl ToJS for namada_sdk::ibc::core::host::types::identifiers::ClientId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::ibc::core::host::types::identifiers::ChannelId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::ibc::core::host::types::identifiers::PortId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::ibc::core::host::types::identifiers::ConnectionId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::ibc::core::host::types::identifiers::Sequence {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.value()))
    }
}

impl ToJS for namada_sdk::ibc::core::channel::types::Version {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::ibc::primitives::Signer {
    fn to_js (&self) -> Result<JsValue, Error> {
        //use namada_sdk::borsh::BorshSerializeExt;
        //let bytes = self.serialize_to_vec();
        //let array = Uint8Array::new_with_length(bytes.len() as u32);
        //array.copy_from(bytes.as_slice());
        Ok(JsValue::from(self.as_ref().to_string()))
    }
}

impl ToJS for namada_sdk::ibc::core::commitment_types::commitment::CommitmentProofBytes {
    fn to_js (&self) -> Result<JsValue, Error> {
        use namada_sdk::borsh::BorshSerializeExt;
        let bytes = self.serialize_to_vec();
        let array = Uint8Array::new_with_length(bytes.len() as u32);
        array.copy_from(bytes.as_slice());
        Ok(JsValue::from(array))
    }
}

impl ToJS for namada_sdk::ibc::core::connection::types::version::Version {
    fn to_js (&self) -> Result<JsValue, Error> {
        use namada_sdk::borsh::BorshSerialize;
        let mut bytes: Vec<u8> = vec![];
        self.serialize(&mut bytes.as_mut_slice()).map_err(|e|Error::new(&format!("{e}")))?;
        let array = Uint8Array::new_with_length(bytes.len() as u32);
        array.copy_from(bytes.as_slice());
        Ok(JsValue::from(array))
    }
}

impl ToJS for namada_sdk::ibc::core::connection::types::Counterparty {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "clientId"     = self.client_id,
            "connectionId" = self.connection_id,
            "prefix"       = self.prefix,
        }))
    }
}

impl ToJS for namada_sdk::ibc::apps::transfer::types::packet::PacketData {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "token"    = self.token,
            "sender"   = self.sender,
            "receiver" = self.receiver,
            "memo"     = self.memo,
        }))
    }
}

impl<D: std::fmt::Display> ToJS for namada_sdk::ibc::apps::transfer::types::Coin<D> {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::transfer::types::Memo {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::packet::PacketData {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "classId"   = self.class_id,
            "classUri"  = self.class_uri,
            "classData" = self.class_data,
            "tokenIds"  = self.token_ids,
            "tokenUris" = self.token_uris,
            "tokenData" = self.token_data,
            "sender"    = self.sender,
            "receiver"  = self.receiver,
            "memo"      = self.memo,
        }))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::Memo {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::TokenId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::TokenIds {
    fn to_js (&self) -> Result<JsValue, Error> {
        self.0.to_js()
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::TokenUri {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::TokenData {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::ClassId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::ClassUri {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::ClassData {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::PrefixedClassId {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "tracePath"   = self.trace_path,
            "baseClassId" = self.base_class_id,
        }))
    }
}

impl ToJS for namada_sdk::ibc::apps::nft_transfer::types::TracePath {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(&format!("{self}")))
    }
}

impl ToJS for namada_sdk::ibc::primitives::proto::Any {
    fn to_js (&self) -> Result<JsValue, Error> {
        use namada_sdk::ibc::primitives::proto::Protobuf;
        use namada_sdk::ibc::clients::tendermint::types::Header;
        Ok(JsValue::from(/*match self.type_url.as_str() {
            "/ibc.lightclients.tendermint.v1.Header" => {
                let value: Header = Protobuf::<Self>::decode(self.value.as_slice())
                    .map_err(|e|Error::new(&format!("{e}")))?;
                to_object! {
                    "typeUrl" = self.type_url,
                    "value"   = value,
                }
            },
            _ => */to_object! {
                "typeUrl" = self.type_url,
                "value"   = self.value,
            }/*
        }*/))
    }
}

impl ToJS for namada_sdk::ibc::clients::tendermint::types::Header {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "signedHeader"            = self.signed_header,
            "validatorSet"            = self.validator_set,
            "trustedHeight"           = self.trusted_height,
            "trustedNextValidatorSet" = self.trusted_next_validator_set,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::Signature {
    fn to_js (&self) -> Result<JsValue, Error> {
        Vec::from(self.as_bytes()).to_js()
    }
}

impl ToJS for namada_sdk::tendermint::block::signed_header::SignedHeader {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "header" = self.header,
            "commit" = self.commit,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::block::Header {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "version"            = self.version,
            "chainId"            = self.chain_id,
            "height"             = self.height,
            "time"               = self.time,
            "lastBlockId"        = self.last_block_id,
            "lastCommitHash"     = self.last_commit_hash,
            "dataHash"           = self.data_hash,
            "validatorsHash"     = self.validators_hash,
            "nextValidatorsHash" = self.next_validators_hash,
            "consensusHash"      = self.consensus_hash,
            "appHash"            = self.app_hash,
            "lastResultsHash"    = self.last_results_hash,
            "evidenceHash"       = self.evidence_hash,
            "proposerAddress"    = self.proposer_address,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::block::Id {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "hash"          = self.hash,
            "partSetHeader" = self.part_set_header,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::block::Height {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.value()))
    }
}

impl ToJS for namada_sdk::tendermint::block::Commit {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "height"     = self.height,
            "round"      = self.round,
            "blockId"    = self.block_id,
            "signatures" = self.signatures,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::block::Round {
    fn to_js (&self) -> Result<JsValue, Error> {
        self.value().to_js()
    }
}

impl ToJS for namada_sdk::tendermint::block::commit_sig::CommitSig {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(match self {
            Self::BlockIdFlagAbsent => to_object! {
                "blockIdFlag" = "absent",
            },
            Self::BlockIdFlagCommit {
                validator_address,
                timestamp,
                signature
            } => to_object! {
                "blockIdFlag"      = "commit",
                "validatorAddress" = validator_address,
                "timestamp"        = timestamp,
                "signature"        = signature,
            },
            Self::BlockIdFlagNil {
                validator_address,
                timestamp,
                signature
            } => to_object! {
                "blockIdFlag"      = "nil",
                "validatorAddress" = validator_address,
                "timestamp"        = timestamp,
                "signature"        = signature,
            },
        }))
    }
}

impl ToJS for namada_sdk::tendermint::block::header::Version {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "block" = self.block,
            "app"   = self.app,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::block::parts::Header {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "total" = self.total,
            "hash"  = self.hash,
        }))
    }
}

impl ToJS for namada_sdk::tendermint::chain::Id {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.as_str()))
    }
}

impl ToJS for namada_sdk::tendermint::account::Id {
    fn to_js (&self) -> Result<JsValue, Error> {
        Vec::from(self.as_bytes()).to_js()
    }
}

impl ToJS for namada_sdk::tendermint::validator::Set {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "hash" = self.hash()
        }))
    }
}

impl ToJS for namada_sdk::tendermint::Hash {
    fn to_js (&self) -> Result<JsValue, Error> {
        Vec::from(self.as_bytes()).to_js()
    }
}

impl ToJS for namada_sdk::tendermint::AppHash {
    fn to_js (&self) -> Result<JsValue, Error> {
        Vec::from(self.as_bytes()).to_js()
    }
}

impl ToJS for namada_sdk::tendermint::Time {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self.to_rfc3339()))
    }
}
