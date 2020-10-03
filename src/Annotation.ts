import "reflect-metadata"

const classStore: Map<string, Function> = new Map()

const sharableKey = Symbol("sharable_property")
const titleKey = Symbol("sharable_id")
const idKey = Symbol("sharable_title")
const nodeKey = Symbol("sharable_node")

/** @internal */
export class SharableProps {
    constructor(title: string, forceToLeaf: boolean) {
        this.title = title
        this.forceToLeaf = forceToLeaf
    }

    readonly title: string
    readonly forceToLeaf: boolean
}

/** @internal */
export class NodeProps<T> {

    /** @internal */
    constructor(
        id: string,
        leaf: boolean,
        serializeFn?: (o: T) => any,
        deserializeFn?: (o: any) => T
    ) {
        this.id = id
        this.leaf = leaf
    }

    readonly id: string
    readonly leaf: boolean
    readonly serializeFn?: (o: T) => any
    readonly deserializeFn?: (o: any) => T
}

export function Node<T extends Function>(classId?: string) {
    return function (target: T) {
        let id = classId ?? target.name
        Reflect.defineMetadata(nodeKey, new NodeProps(id, false), target)
        classStore.set(id, target)
    }
}

// export, import
export function Leaf<T extends Function>(
    classId?: string,
    serializeFn?: (o: T) => any,
    deserializeFn?: (o: any) => T
) {
    return function (target: T) {
        let id = classId ?? target.name
        Reflect.defineMetadata(nodeKey, new NodeProps(id, true, serializeFn, deserializeFn), target)
        classStore.set(id, target)
    }
}

export function Sharable<T>(title?: string, forceToLeaf: boolean = false) {
    return function (
        target: T,
        propertyKey: string,
    ) {
        Reflect.defineMetadata(
            sharableKey,
            new SharableProps(title ?? propertyKey, forceToLeaf),
            target,
            propertyKey)
    }
}

export function Id<T>(
    target: T,
    propertyKey: string,
) {
    Reflect.defineMetadata(
        idKey,
        true,
        target,
        propertyKey)
}

export function Title<T>(
    target: T,
    propertyKey: string,
) {
    Reflect.defineMetadata(
        titleKey,
        true,
        target,
        propertyKey)
}

/** @internal */
export function isSharable(obj: any, propName: string) {
    return !!Reflect.getMetadata(sharableKey, obj, propName)
}

/** @internal */
export function getSharableProps(obj: any, propName: string) {
    return Reflect.getMetadata(sharableKey, obj, propName) as SharableProps
}

/** @internal */
export function isTitle(obj: any, propName: string) {
    return Reflect.getMetadata(titleKey, obj, propName) ?? false
}

/** @internal */
export function isId(obj: any, propName: string) {
    return Reflect.getMetadata(idKey, obj, propName) ?? false
}

/** @internal */
export function getNodeProps<T extends Object>(obj: T) {
    if (obj !== null && typeof obj === "object") {
        return Reflect.getMetadata(nodeKey, obj.constructor) as (NodeProps<T> | undefined)
    }
    else if (obj !== null && typeof obj === "function") {
        return Reflect.getMetadata(nodeKey, obj) as (NodeProps<T> | undefined)
    }
    else {
        return undefined
    }
}

/** @internal */
export function isNodeClass<T extends Object>(obj: T) {
    let props = getNodeProps(obj)
    return !!props && !props.leaf
}

/** @internal */
export function getClassById(id: string) {
    return classStore.get(id)
}