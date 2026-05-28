'use client';

import type { GlobalPermission } from 'payload/auth';
import type { DefaultGlobalViewProps } from 'payload/dist/admin/components/views/Global/Default';
import DefaultGlobalView from 'payload/dist/admin/components/views/Global/Default';
import type { AdminViewComponent } from 'payload/dist/config/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const editModeParam = 'mode';
const editModeValue = 'edit';

type BrowserLocationState = {
  hash: string;
  pathname: string;
  search: string;
};

function getBrowserLocation(): BrowserLocationState {
  if (typeof window === 'undefined') {
    return {
      hash: '',
      pathname: '',
      search: '',
    };
  }

  return {
    hash: window.location.hash,
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

function updateSearchParam(search: string, enabled: boolean) {
  const params = new URLSearchParams(search);

  if (enabled) {
    params.set(editModeParam, editModeValue);
  } else {
    params.delete(editModeParam);
  }

  const nextSearch = params.toString();

  return nextSearch ? `?${nextSearch}` : '';
}

function gateUpdatePermission(
  permissions: GlobalPermission | null,
  canEdit: boolean,
): GlobalPermission | null {
  if (!permissions) {
    return permissions;
  }

  return {
    ...permissions,
    update: {
      ...permissions.update,
      permission: Boolean(permissions.update?.permission && canEdit),
    },
  };
}

function SiteSettingsEditGateView(props: DefaultGlobalViewProps) {
  const { global, onSave, permissions } = props;
  const [location, setLocation] = useState(getBrowserLocation);
  const isDefaultEditPath = location.pathname.endsWith(`/globals/${global.slug}`);
  const isEditMode = new URLSearchParams(location.search).get(editModeParam) === editModeValue;
  const hasUpdatePermission = Boolean(permissions?.update?.permission);
  const shouldLockForm = isDefaultEditPath && !isEditMode;

  useEffect(() => {
    const syncLocation = () => setLocation(getBrowserLocation());

    syncLocation();
    window.addEventListener('popstate', syncLocation);

    return () => window.removeEventListener('popstate', syncLocation);
  }, []);

  const gatedPermissions = useMemo(
    () => gateUpdatePermission(permissions, !shouldLockForm),
    [permissions, shouldLockForm],
  );

  const setEditModeUrl = useCallback((enabled: boolean, replace = false) => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentLocation = getBrowserLocation();
    const nextSearch = updateSearchParam(currentLocation.search, enabled);
    const nextUrl = `${currentLocation.pathname}${nextSearch}${currentLocation.hash}`;

    if (replace) {
      window.history.replaceState(window.history.state, '', nextUrl);
    } else {
      window.history.pushState(window.history.state, '', nextUrl);
    }

    setLocation(getBrowserLocation());
  }, []);

  const EditModeAction = useMemo(() => {
    const SiteSettingsEditAction = () => (
      <button
        className="yourfield-edit-action"
        type="button"
        onClick={() => setEditModeUrl(!isEditMode)}
      >
        {isEditMode ? '取消编辑' : '编辑'}
      </button>
    );

    return SiteSettingsEditAction;
  }, [isEditMode, setEditModeUrl]);

  const globalWithEditAction = useMemo(() => {
    if (!isDefaultEditPath || !hasUpdatePermission) {
      return global;
    }

    return {
      ...global,
      admin: {
        ...global.admin,
        components: {
          ...global.admin.components,
          views: {
            ...global.admin.components.views,
            Edit: {
              Default: {
                actions: [EditModeAction],
              },
            },
          },
        },
      },
    };
  }, [EditModeAction, global, hasUpdatePermission, isDefaultEditPath]);

  const handleSave = useCallback(
    (json: Parameters<DefaultGlobalViewProps['onSave']>[0]) => {
      onSave(json);

      if (isDefaultEditPath) {
        setEditModeUrl(false, true);
      }
    },
    [isDefaultEditPath, onSave, setEditModeUrl],
  );

  return (
    <DefaultGlobalView
      {...props}
      global={globalWithEditAction}
      onSave={handleSave}
      permissions={gatedPermissions}
    />
  );
}

export const SiteSettingsEditGate = SiteSettingsEditGateView as unknown as AdminViewComponent;
