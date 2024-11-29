extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use js_sys::*;
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
    #[wasm_bindgen] pub fn ibc (source: Uint8Array) -> Result<JsString, Error> {
        let mut buffer = vec![0u8;source.length() as usize];
        source.copy_to(buffer.as_mut_slice());
        let decoded = decode_message::<()>(&buffer[..]).map_err(|e|Error::new(&format!("{e}")))?;
        match decoded {

            IbcMessage::Envelope(message) => match *message {

                MsgEnvelope::Client(message) => match message {
                    ClientMsg::CreateClient(MsgCreateClient {
                        client_state,
                        consensus_state,
                        signer,
                    }) => to_object! {
                        "clientState"    = client_state,
                        "consensusState" = consensus_state,
                        "signer"         = signer,
                    },
                    ClientMsg::UpdateClient(MsgUpdateClient {
                        client_id,
                        client_message,
                        signer,
                    }) => to_object! {
                        "clientId"      = client_id,
                        "clientMessage" = client_message,
                        "signer"        = signer,
                    },
                    ClientMsg::Misbehaviour(MsgSubmitMisbehaviour {
                        client_id,
                        misbehaviour,
                        signer,
                    }) => to_object! {
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
        Ok(JsString::from(format!("{decoded:?}")))
    }
}

pub trait ToJS {
    fn to_js (&self) -> Result<JsValue, Error>;
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

impl ToJS for u64 {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(*self))
    }
}

impl ToJS for Object {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(self))
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

impl ToJS for namada_sdk::ibc::core::client::types::Height {
    fn to_js (&self) -> Result<JsValue, Error> {
        Ok(JsValue::from(to_object! {
            "revision_number" = self.revision_number(),
            "revision_height" = self.revision_height(),
        }))
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

impl ToJS for namada_sdk::ibc::core::commitment_types::commitment::CommitmentProofBytes {
    fn to_js (&self) -> Result<JsValue, Error> {
        use namada_sdk::borsh::BorshSerializeExt;
        let bytes = self.serialize_to_vec();
        let array = Uint8Array::new_with_length(bytes.len() as u32);
        array.copy_from(bytes.as_slice());
        Ok(JsValue::from(array))
    }
}
