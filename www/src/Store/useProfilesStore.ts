import { create } from 'zustand';
import WebApi from '../Services/WebApi';
import { PinActionValues, BUTTON_ACTIONS } from '../Data/Pins';
import { DEFAULT_KEYBOARD_MAPPING } from '../Data/Keyboard';

const ACTION_TO_DEFAULT_KEYCODE: Record<number, number> = {};
for (const [name, keycode] of Object.entries(DEFAULT_KEYBOARD_MAPPING)) {
	const actionKey = `BUTTON_PRESS_${name.toUpperCase()}`;
	const actionValue = (BUTTON_ACTIONS as Record<string, number>)[actionKey];
	if (actionValue !== undefined)
		ACTION_TO_DEFAULT_KEYCODE[actionValue] = keycode;
}

// Max number of profiles that can be created, including the base profile
export const MAX_PROFILES = 4;

type CustomMasks = {
	customButtonMask: number;
	customDpadMask: number;
};

export type MaskPayload = {
	action: PinActionValues;
	keyboardKeycode: number;
	keyboardModifierMask: number;
} & CustomMasks;

export type PinsType = {
	pin00: MaskPayload;
	pin01: MaskPayload;
	pin02: MaskPayload;
	pin03: MaskPayload;
	pin04: MaskPayload;
	pin05: MaskPayload;
	pin06: MaskPayload;
	pin07: MaskPayload;
	pin08: MaskPayload;
	pin09: MaskPayload;
	pin10: MaskPayload;
	pin11: MaskPayload;
	pin12: MaskPayload;
	pin13: MaskPayload;
	pin14: MaskPayload;
	pin15: MaskPayload;
	pin16: MaskPayload;
	pin17: MaskPayload;
	pin18: MaskPayload;
	pin19: MaskPayload;
	pin20: MaskPayload;
	pin21: MaskPayload;
	pin22: MaskPayload;
	pin23: MaskPayload;
	pin24: MaskPayload;
	pin25: MaskPayload;
	pin26: MaskPayload;
	pin27: MaskPayload;
	pin28: MaskPayload;
	pin29: MaskPayload;
	profileLabel: string;
	enabled: boolean;
};

type State = {
	profiles: PinsType[];
	savedProfiles: PinsType[];
	loadingProfiles: boolean;
};

export type SetProfilePinType = (
	profileIndex: number,
	pin: string,
	{ action, customButtonMask, customDpadMask }: MaskPayload,
) => void;

type Actions = {
	copyBaseProfile: (profileIndex: number) => void;
	fetchProfiles: () => void;
	saveProfiles: () => Promise<object>;
	setProfileLabel: (profileIndex: number, profileLabel: string) => void;
	setProfilePin: SetProfilePinType;
	toggleProfileEnabled: (profileIndex: number) => void;
};

const INITIAL_STATE: State = {
	profiles: [
		// Profiles will be populated dynamically
	],
	savedProfiles: [],
	loadingProfiles: false,
};

const normalizePinData = (profile: PinsType): PinsType => {
	const normalized = { ...profile };
	for (let i = 0; i < 30; i++) {
		const key = `pin${i.toString().padStart(2, '0')}`;
		const pin = (normalized as Record<string, unknown>)[key] as MaskPayload | undefined;
		if (pin) {
			const defaultKeycode = ACTION_TO_DEFAULT_KEYCODE[pin.action] ?? 0;
			(normalized as Record<string, unknown>)[key] = {
				...pin,
				keyboardKeycode: pin.keyboardKeycode ?? defaultKeycode,
				keyboardModifierMask: pin.keyboardModifierMask ?? 0,
			};
		}
	}
	return normalized;
};

const useProfilesStore = create<State & Actions>()((set, get) => ({
	...INITIAL_STATE,
	fetchProfiles: async () => {
		set({ loadingProfiles: true });

		const baseProfile = normalizePinData(await WebApi.getPinMappings());
		const profiles = (await WebApi.getProfileOptions()).map(normalizePinData);
		const allProfiles = [baseProfile, ...profiles];

		while (allProfiles.length < MAX_PROFILES) {
			allProfiles.push({
				...JSON.parse(JSON.stringify(baseProfile)),
				profileLabel: `Profile ${allProfiles.length + 1}`,
				enabled: false,
			});
		}

		set((state) => ({
			...state,
			profiles: allProfiles,
			savedProfiles: JSON.parse(JSON.stringify(allProfiles)),
			loadingProfiles: false,
		}));
	},
	copyBaseProfile: (profileIndex) =>
		set((state) => ({
			...state,
			profiles: state.profiles.map((profile, index) =>
				index === profileIndex
					? {
							...profile,
							...state.profiles[0],
							profileLabel: profile.profileLabel,
						}
					: profile,
			),
		})),
	setProfilePin: (
		profileIndex,
		pin,
		{ action, customButtonMask = 0, customDpadMask = 0, keyboardKeycode = 0, keyboardModifierMask = 0 },
	) =>
		set((state) => {
			const profiles = [...state.profiles];
			profiles[profileIndex] = {
				...profiles[profileIndex],
				[pin]: {
					action,
					customButtonMask,
					customDpadMask,
					keyboardKeycode,
					keyboardModifierMask,
				},
			};
			return { profiles };
		}),
	setProfileLabel: (profileIndex, profileLabel) =>
		set((state) => {
			const profiles = [...state.profiles];
			profiles[profileIndex] = { ...profiles[profileIndex], profileLabel };
			return { profiles };
		}),
	saveProfiles: async () => {
		const [baseProfile, ...profiles] = get().profiles;
		const result = await Promise.all([
			WebApi.setPinMappings(baseProfile),
			WebApi.setProfileOptions(profiles),
		]);
		set({ savedProfiles: JSON.parse(JSON.stringify(get().profiles)) });
		return result;
	},
	toggleProfileEnabled: (profileIndex) =>
		set((state) => {
			const profiles = [...state.profiles];
			profiles[profileIndex] = {
				...profiles[profileIndex],
				enabled: !profiles[profileIndex].enabled,
			};
			return { ...state, profiles };
		}),
}));

export default useProfilesStore;
