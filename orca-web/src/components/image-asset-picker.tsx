'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services';
import type { ImageAsset } from '@/lib/types';
import { resolveImageAssetUrl } from '@/lib/utils/image-assets';
import { Select, Space, Spin } from 'antd';

interface ImageAssetPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
}

export function ImageAssetPicker({ value, onChange }: ImageAssetPickerProps) {
  const {
    data: assets = [],
    isLoading,
  } = useQuery({
    queryKey: ['image-assets'],
    queryFn: () => catalogService.listImageAssets(),
  });

  const selectedAsset = useMemo(
    () => assets.find((a) => a.slug === value),
    [assets, value]
  );

  const options = assets.map((asset: ImageAsset) => ({
    value: asset.slug,
    label: (
      <Space size={8}>
        <Image
          src={resolveImageAssetUrl(asset.url)}
          alt={asset.name}
          width={24}
          height={24}
          style={{ objectFit: 'contain' }}
          unoptimized
        />
        <span>{asset.name}</span>
      </Space>
    ),
  }));

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Select
          showSearch
          allowClear
          placeholder="Selecione um icone"
          options={options}
          value={value}
          onChange={(next) => onChange?.(next)}
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.value).toLowerCase().includes(input.toLowerCase())
          }
          notFoundContent={isLoading ? <Spin size="small" /> : 'Sem imagens'}
        />

        {selectedAsset && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image
              src={resolveImageAssetUrl(selectedAsset.url)}
              alt={selectedAsset.name}
              width={48}
              height={48}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
            <div>
              <div style={{ fontWeight: 600 }}>{selectedAsset.name}</div>
              <div style={{ color: '#666' }}>{selectedAsset.slug}</div>
            </div>
          </div>
        )}

      </Space>
    </div>
  );
}
